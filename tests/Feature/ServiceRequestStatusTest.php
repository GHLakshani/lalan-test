<?php

namespace Tests\Feature;

use App\Actions\ChangeServiceRequestStatus;
use App\Enums\ServiceRequestStatus;
use App\Exceptions\StaleServiceRequestException;
use App\Models\ServiceRequest;
use App\Models\ServiceRequestStatusHistory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use RuntimeException;
use Tests\TestCase;

class ServiceRequestStatusTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
    }

    private function openRequest(): ServiceRequest
    {
        return ServiceRequest::factory()->for($this->user)->status(ServiceRequestStatus::Open)->create();
    }

    private function requestWithStatus(ServiceRequestStatus $status): ServiceRequest
    {
        $serviceRequest = $this->openRequest();
        $action = app(ChangeServiceRequestStatus::class);

        while ($serviceRequest->status !== $status) {
            $serviceRequest = $action->handle($serviceRequest, $serviceRequest->status->next(), $serviceRequest->version, $this->user);
        }

        return $serviceRequest;
    }

    private function patchStatus(ServiceRequest $serviceRequest, array $payload)
    {
        return $this->patchJson("/api/service-requests/{$serviceRequest->id}/status", $payload);
    }

    public function test_guest_cannot_change_status(): void
    {
        $serviceRequest = $this->openRequest();

        $this->patchStatus($serviceRequest, ['status' => 'in_progress', 'version' => 1])->assertUnauthorized();
    }

    public function test_status_moves_from_open_to_in_progress(): void
    {
        Sanctum::actingAs($this->user);
        $serviceRequest = $this->openRequest();

        $this->patchStatus($serviceRequest, [
            'status' => 'in_progress',
            'version' => 1,
            'remark' => '  Technician assigned.  ',
        ])
            ->assertOk()
            ->assertJsonPath('data.status.value', 'in_progress')
            ->assertJsonPath('data.version', 2)
            ->assertJsonPath('data.next_status.value', 'resolved')
            ->assertJsonPath('data.status_history.0.from_status.value', 'open')
            ->assertJsonPath('data.status_history.0.to_status.value', 'in_progress')
            ->assertJsonPath('data.status_history.0.version', 2)
            ->assertJsonPath('data.status_history.0.remark', 'Technician assigned.')
            ->assertJsonPath('data.status_history.0.changed_by.id', $this->user->id);

        $this->assertDatabaseHas('service_requests', [
            'id' => $serviceRequest->id,
            'status' => 'in_progress',
            'version' => 2,
        ]);
    }

    public function test_status_moves_from_in_progress_to_resolved(): void
    {
        Sanctum::actingAs($this->user);
        $serviceRequest = $this->requestWithStatus(ServiceRequestStatus::InProgress);

        $this->patchStatus($serviceRequest, ['status' => 'resolved', 'version' => 2])
            ->assertOk()
            ->assertJsonPath('data.status.value', 'resolved')
            ->assertJsonPath('data.version', 3)
            ->assertJsonPath('data.next_status', null)
            ->assertJsonPath('data.status_history.0.remark', null);
    }

    public function test_remark_is_optional_and_blank_remark_is_stored_as_null(): void
    {
        Sanctum::actingAs($this->user);
        $serviceRequest = $this->openRequest();

        $this->patchStatus($serviceRequest, ['status' => 'in_progress', 'version' => 1, 'remark' => '   '])
            ->assertOk()
            ->assertJsonPath('data.status_history.0.remark', null);
    }

    public function test_each_successful_change_creates_exactly_one_history_record(): void
    {
        Sanctum::actingAs($this->user);
        $serviceRequest = $this->openRequest();

        $this->assertSame(1, $serviceRequest->statusHistories()->count());

        $this->patchStatus($serviceRequest, ['status' => 'in_progress', 'version' => 1])->assertOk();
        $this->assertSame(2, $serviceRequest->statusHistories()->count());

        $this->patchStatus($serviceRequest, ['status' => 'resolved', 'version' => 2])->assertOk();
        $this->assertSame(3, $serviceRequest->statusHistories()->count());

        $this->assertSame([1, 2, 3], $serviceRequest->statusHistories()->pluck('version')->sort()->values()->all());
    }

    public static function invalidTransitions(): array
    {
        return [
            'skip from open to resolved' => [ServiceRequestStatus::Open, 'resolved', 'Cannot change status from Open to Resolved. The next allowed status is In Progress.'],
            'stay open' => [ServiceRequestStatus::Open, 'open', 'This request is already Open.'],
            'reverse from in progress to open' => [ServiceRequestStatus::InProgress, 'open', 'Cannot change status from In Progress to Open. The next allowed status is Resolved.'],
            'stay in progress' => [ServiceRequestStatus::InProgress, 'in_progress', 'This request is already In Progress.'],
            'reverse from resolved to in progress' => [ServiceRequestStatus::Resolved, 'in_progress', 'This request is already Resolved. Its status can no longer be changed.'],
            'reverse from resolved to open' => [ServiceRequestStatus::Resolved, 'open', 'This request is already Resolved. Its status can no longer be changed.'],
            'stay resolved' => [ServiceRequestStatus::Resolved, 'resolved', 'This request is already Resolved. Its status can no longer be changed.'],
        ];
    }

    #[DataProvider('invalidTransitions')]
    public function test_invalid_status_changes_are_rejected(ServiceRequestStatus $from, string $to, string $message): void
    {
        Sanctum::actingAs($this->user);
        $serviceRequest = $this->requestWithStatus($from);
        $historyCount = $serviceRequest->statusHistories()->count();

        $this->patchStatus($serviceRequest, ['status' => $to, 'version' => $serviceRequest->version])
            ->assertUnprocessable()
            ->assertJsonPath('message', $message)
            ->assertJsonPath('errors.status.0', $message);

        $fresh = $serviceRequest->fresh();
        $this->assertSame($from, $fresh->status);
        $this->assertSame($serviceRequest->version, $fresh->version);
        $this->assertSame($historyCount, $serviceRequest->statusHistories()->count());
    }

    public function test_status_change_validates_input(): void
    {
        Sanctum::actingAs($this->user);
        $serviceRequest = $this->openRequest();

        $this->patchStatus($serviceRequest, [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status', 'version']);

        $this->patchStatus($serviceRequest, [
            'status' => 'closed',
            'version' => 'abc',
            'remark' => str_repeat('a', 1001),
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status', 'version', 'remark']);
    }

    public function test_status_change_for_missing_request_returns_not_found(): void
    {
        Sanctum::actingAs($this->user);

        $this->patchJson('/api/service-requests/999/status', ['status' => 'in_progress', 'version' => 1])
            ->assertNotFound();
    }

    public function test_outdated_version_is_rejected_with_conflict(): void
    {
        Sanctum::actingAs($this->user);
        $serviceRequest = $this->openRequest();

        $this->patchStatus($serviceRequest, ['status' => 'in_progress', 'version' => 1])->assertOk();

        $this->patchStatus($serviceRequest, ['status' => 'resolved', 'version' => 1, 'remark' => 'Stale update'])
            ->assertConflict()
            ->assertJsonPath('current_version', 2)
            ->assertJsonPath('data.status.value', 'in_progress')
            ->assertJsonPath('data.version', 2)
            ->assertJsonCount(2, 'data.status_history');

        $fresh = $serviceRequest->fresh();
        $this->assertSame(ServiceRequestStatus::InProgress, $fresh->status);
        $this->assertSame(2, $fresh->version);
        $this->assertDatabaseMissing('service_request_status_histories', ['remark' => 'Stale update']);
    }

    public function test_two_users_with_the_same_version_only_first_wins(): void
    {
        $first = User::factory()->create();
        $second = User::factory()->create();
        $serviceRequest = $this->openRequest();

        Sanctum::actingAs($first);
        $this->patchStatus($serviceRequest, ['status' => 'in_progress', 'version' => 1, 'remark' => 'First'])
            ->assertOk();

        Sanctum::actingAs($second);
        $this->patchStatus($serviceRequest, ['status' => 'in_progress', 'version' => 1, 'remark' => 'Second'])
            ->assertConflict();

        $this->assertSame(2, $serviceRequest->statusHistories()->count());
        $this->assertDatabaseHas('service_request_status_histories', ['remark' => 'First', 'changed_by' => $first->id]);
        $this->assertDatabaseMissing('service_request_status_histories', ['remark' => 'Second']);
    }

    public function test_future_version_is_rejected_with_conflict(): void
    {
        Sanctum::actingAs($this->user);
        $serviceRequest = $this->openRequest();

        $this->patchStatus($serviceRequest, ['status' => 'in_progress', 'version' => 5])
            ->assertConflict()
            ->assertJsonPath('current_version', 1);

        $this->assertSame(ServiceRequestStatus::Open, $serviceRequest->fresh()->status);
    }

    public function test_version_is_checked_before_transition_rules(): void
    {
        Sanctum::actingAs($this->user);
        $serviceRequest = $this->requestWithStatus(ServiceRequestStatus::Resolved);

        $this->patchStatus($serviceRequest, ['status' => 'resolved', 'version' => 1])
            ->assertConflict();
    }

    public function test_conditional_update_detects_a_change_made_after_the_version_check(): void
    {
        $serviceRequest = $this->openRequest();

        DB::listen(function ($query) use ($serviceRequest) {
            static $bumped = false;

            if (! $bumped && str_starts_with(strtolower($query->sql), 'select') && str_contains($query->sql, 'service_requests')) {
                $bumped = true;
                DB::table('service_requests')->where('id', $serviceRequest->id)->update(['version' => 7]);
            }
        });

        try {
            app(ChangeServiceRequestStatus::class)->handle($serviceRequest, ServiceRequestStatus::InProgress, 1, $this->user);
            $this->fail('Expected a stale version exception.');
        } catch (StaleServiceRequestException $exception) {
            $this->assertSame(1, $exception->expectedVersion);
            $this->assertSame(7, $exception->currentVersion);
        }

        $this->assertSame(1, $serviceRequest->statusHistories()->count());
    }

    public function test_status_change_is_rolled_back_when_history_cannot_be_saved(): void
    {
        $serviceRequest = $this->openRequest();

        ServiceRequestStatusHistory::creating(function () {
            throw new RuntimeException('History storage failed.');
        });

        try {
            app(ChangeServiceRequestStatus::class)->handle($serviceRequest, ServiceRequestStatus::InProgress, 1, $this->user);
            $this->fail('Expected the history failure to bubble up.');
        } catch (RuntimeException $exception) {
            $this->assertSame('History storage failed.', $exception->getMessage());
        }

        $fresh = $serviceRequest->fresh();
        $this->assertSame(ServiceRequestStatus::Open, $fresh->status);
        $this->assertSame(1, $fresh->version);
        $this->assertSame(1, $serviceRequest->statusHistories()->count());
    }
}

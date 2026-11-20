<?php

namespace Tests\Feature;

use App\Actions\ChangeServiceRequestStatus;
use App\Enums\ServiceRequestStatus;
use App\Models\ServiceRequest;
use App\Models\User;
use Database\Seeders\DemoUserSeeder;
use Database\Seeders\ServiceRequestSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use LogicException;
use Tests\TestCase;

class ServiceRequestHistoryTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
    }

    private function changeStatus(ServiceRequest $serviceRequest, ServiceRequestStatus $status, ?string $remark = null): ServiceRequest
    {
        return app(ChangeServiceRequestStatus::class)->handle(
            $serviceRequest,
            $status,
            $serviceRequest->version,
            $this->user,
            $remark,
        );
    }

    public function test_new_request_starts_at_version_one_with_initial_history(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/requests', [
            'title' => 'Monitor flickering',
            'description' => 'The left monitor flickers every few seconds.',
            'priority' => 'MEDIUM',
        ])
            ->assertCreated()
            ->assertJsonPath('data.version', 1)
            ->assertJsonPath('data.next_status.value', 'IN_PROGRESS')
            ->assertJsonCount(1, 'data.status_history')
            ->assertJsonPath('data.status_history.0.from_status', null)
            ->assertJsonPath('data.status_history.0.to_status.value', 'OPEN')
            ->assertJsonPath('data.status_history.0.version', 1)
            ->assertJsonPath('data.status_history.0.remark', null)
            ->assertJsonPath('data.status_history.0.actor.id', $this->user->id);

        $this->assertDatabaseHas('request_status_histories', [
            'service_request_id' => $response->json('data.id'),
            'from_status' => null,
            'to_status' => 'OPEN',
            'version' => 1,
            'actor_user_id' => $this->user->id,
        ]);
    }

    public function test_status_cannot_be_changed_directly_on_the_model(): void
    {
        $serviceRequest = ServiceRequest::factory()->for($this->user)->status(ServiceRequestStatus::Open)->create();

        $serviceRequest->status = ServiceRequestStatus::Resolved;

        $this->expectException(LogicException::class);
        $serviceRequest->save();
    }

    public function test_status_is_not_mass_assignable(): void
    {
        $serviceRequest = ServiceRequest::factory()->for($this->user)->status(ServiceRequestStatus::Open)->create();

        $serviceRequest->update(['status' => ServiceRequestStatus::Resolved, 'title' => 'New title']);

        $fresh = $serviceRequest->fresh();
        $this->assertSame(ServiceRequestStatus::Open, $fresh->status);
        $this->assertSame('New title', $fresh->title);
    }

    public function test_other_changes_increment_version_without_history(): void
    {
        $serviceRequest = ServiceRequest::factory()->for($this->user)->create();

        $serviceRequest->update(['title' => 'Updated title']);

        $this->assertSame(2, $serviceRequest->fresh()->version);
        $this->assertSame(1, $serviceRequest->statusHistories()->count());
    }

    public function test_saving_without_changes_keeps_version(): void
    {
        $serviceRequest = ServiceRequest::factory()->for($this->user)->create();

        $serviceRequest->save();

        $this->assertSame(1, $serviceRequest->fresh()->version);
    }

    public function test_show_returns_version_and_history_newest_first(): void
    {
        Sanctum::actingAs($this->user);

        $this->travelTo(now()->subDays(3));
        $serviceRequest = ServiceRequest::factory()->for($this->user)->status(ServiceRequestStatus::Open)->create();

        $this->travelTo(now()->addDay());
        $serviceRequest = $this->changeStatus($serviceRequest, ServiceRequestStatus::InProgress);

        $this->travelTo(now()->addDay());
        $this->changeStatus($serviceRequest, ServiceRequestStatus::Resolved, 'Fixed the cable.');

        $this->travelBack();

        $this->getJson("/api/requests/{$serviceRequest->id}")
            ->assertOk()
            ->assertJsonPath('data.status.value', 'RESOLVED')
            ->assertJsonPath('data.version', 3)
            ->assertJsonPath('data.next_status', null)
            ->assertJsonCount(3, 'data.status_history')
            ->assertJsonPath('data.status_history.0.from_status.value', 'IN_PROGRESS')
            ->assertJsonPath('data.status_history.0.to_status.value', 'RESOLVED')
            ->assertJsonPath('data.status_history.0.version', 3)
            ->assertJsonPath('data.status_history.0.remark', 'Fixed the cable.')
            ->assertJsonPath('data.status_history.1.to_status.value', 'IN_PROGRESS')
            ->assertJsonPath('data.status_history.2.from_status', null)
            ->assertJsonPath('data.status_history.2.to_status.value', 'OPEN')
            ->assertJsonStructure([
                'data' => [
                    'status_history' => [['id', 'from_status', 'to_status', 'version', 'remark', 'actor', 'created_at']],
                ],
            ]);
    }

    public function test_history_endpoint_returns_the_owners_audit_trail_in_chronological_order(): void
    {
        Sanctum::actingAs($this->user);

        $this->travelTo(now()->subDays(3));
        $serviceRequest = ServiceRequest::factory()->for($this->user)->status(ServiceRequestStatus::Open)->create();

        $this->travelTo(now()->addDay());
        $serviceRequest = $this->changeStatus($serviceRequest, ServiceRequestStatus::InProgress, 'Technician assigned');

        $this->travelTo(now()->addDay());
        $this->changeStatus($serviceRequest, ServiceRequestStatus::Resolved);

        $this->travelBack();

        $this->getJson("/api/requests/{$serviceRequest->id}/history")
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.from_status', null)
            ->assertJsonPath('data.0.to_status.value', 'OPEN')
            ->assertJsonPath('data.0.version', 1)
            ->assertJsonPath('data.1.from_status.value', 'OPEN')
            ->assertJsonPath('data.1.to_status.value', 'IN_PROGRESS')
            ->assertJsonPath('data.1.remark', 'Technician assigned')
            ->assertJsonPath('data.1.actor.id', $this->user->id)
            ->assertJsonPath('data.2.to_status.value', 'RESOLVED')
            ->assertJsonPath('data.2.version', 3)
            ->assertJsonStructure(['data' => [['id', 'from_status', 'to_status', 'version', 'remark', 'actor', 'created_at']]]);
    }

    public function test_history_endpoint_rejects_guests_and_unknown_requests(): void
    {
        $serviceRequest = ServiceRequest::factory()->for($this->user)->create();

        $this->getJson("/api/requests/{$serviceRequest->id}/history")->assertUnauthorized();

        Sanctum::actingAs($this->user);

        $this->getJson('/api/requests/999999/history')->assertNotFound();
    }

    public function test_index_includes_version_but_not_history(): void
    {
        Sanctum::actingAs($this->user);
        ServiceRequest::factory()->for($this->user)->create();

        $this->getJson('/api/requests')
            ->assertOk()
            ->assertJsonPath('data.0.version', 1)
            ->assertJsonMissingPath('data.0.status_history');
    }

    public function test_history_is_deleted_with_request(): void
    {
        $serviceRequest = ServiceRequest::factory()->for($this->user)->create();

        $serviceRequest->delete();

        $this->assertDatabaseCount('request_status_histories', 0);
    }

    public function test_seeded_requests_have_consistent_history(): void
    {
        $this->seed([DemoUserSeeder::class, ServiceRequestSeeder::class]);

        $this->assertSame(40, ServiceRequest::count());

        ServiceRequest::with('statusHistories')->get()->each(function (ServiceRequest $serviceRequest) {
            $history = $serviceRequest->statusHistories;

            $this->assertSame($serviceRequest->version, $history->count());
            $this->assertSame($serviceRequest->status, $history->first()->to_status);
            $this->assertSame(ServiceRequestStatus::Open, $history->last()->to_status);
            $this->assertNull($history->last()->from_status);

            $history->reverse()->values()->each(function ($entry, $index) use ($serviceRequest) {
                $this->assertSame($index + 1, $entry->version);
                $this->assertSame($serviceRequest->created_by, $entry->actor_user_id);

                if ($entry->from_status !== null) {
                    $this->assertTrue($entry->from_status->canTransitionTo($entry->to_status));
                }
            });
        });
    }
}

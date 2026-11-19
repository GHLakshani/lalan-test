<?php

namespace Tests\Feature;

use App\Enums\ServiceRequestStatus;
use App\Models\ServiceRequest;
use App\Models\User;
use Database\Seeders\DemoUserSeeder;
use Database\Seeders\ServiceRequestSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
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

    public function test_new_request_starts_at_version_one_with_initial_history(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/service-requests', [
            'title' => 'Monitor flickering',
            'description' => 'The left monitor flickers every few seconds.',
            'priority' => 'medium',
        ])
            ->assertCreated()
            ->assertJsonPath('data.version', 1)
            ->assertJsonCount(1, 'data.status_history')
            ->assertJsonPath('data.status_history.0.from_status', null)
            ->assertJsonPath('data.status_history.0.to_status.value', 'open')
            ->assertJsonPath('data.status_history.0.version', 1)
            ->assertJsonPath('data.status_history.0.changed_by.id', $this->user->id);

        $this->assertDatabaseHas('service_request_status_histories', [
            'service_request_id' => $response->json('data.id'),
            'from_status' => null,
            'to_status' => 'open',
            'version' => 1,
            'changed_by' => $this->user->id,
        ]);
    }

    public function test_status_change_increments_version_and_records_history(): void
    {
        $serviceRequest = ServiceRequest::factory()->for($this->user)->status(ServiceRequestStatus::Open)->create();
        $agent = User::factory()->create();

        $this->actingAs($agent);
        $serviceRequest->update(['status' => ServiceRequestStatus::InProgress]);

        $this->assertSame(2, $serviceRequest->fresh()->version);
        $this->assertDatabaseHas('service_request_status_histories', [
            'service_request_id' => $serviceRequest->id,
            'from_status' => 'open',
            'to_status' => 'in_progress',
            'version' => 2,
            'changed_by' => $agent->id,
        ]);
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
        $serviceRequest->update(['status' => ServiceRequestStatus::InProgress]);

        $this->travelTo(now()->addDay());
        $serviceRequest->update(['status' => ServiceRequestStatus::Resolved]);

        $this->travelBack();

        $this->getJson("/api/service-requests/{$serviceRequest->id}")
            ->assertOk()
            ->assertJsonPath('data.status.value', 'resolved')
            ->assertJsonPath('data.version', 3)
            ->assertJsonCount(3, 'data.status_history')
            ->assertJsonPath('data.status_history.0.from_status.value', 'in_progress')
            ->assertJsonPath('data.status_history.0.to_status.value', 'resolved')
            ->assertJsonPath('data.status_history.0.version', 3)
            ->assertJsonPath('data.status_history.1.to_status.value', 'in_progress')
            ->assertJsonPath('data.status_history.2.from_status', null)
            ->assertJsonPath('data.status_history.2.to_status.value', 'open')
            ->assertJsonStructure([
                'data' => [
                    'status_history' => [['id', 'from_status', 'to_status', 'version', 'changed_by', 'created_at']],
                ],
            ]);
    }

    public function test_index_includes_version_but_not_history(): void
    {
        Sanctum::actingAs($this->user);
        ServiceRequest::factory()->for($this->user)->create();

        $this->getJson('/api/service-requests')
            ->assertOk()
            ->assertJsonPath('data.0.version', 1)
            ->assertJsonMissingPath('data.0.status_history');
    }

    public function test_history_is_deleted_with_request(): void
    {
        $serviceRequest = ServiceRequest::factory()->for($this->user)->create();

        $serviceRequest->delete();

        $this->assertDatabaseCount('service_request_status_histories', 0);
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
        });
    }
}

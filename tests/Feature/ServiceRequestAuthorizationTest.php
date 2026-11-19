<?php

namespace Tests\Feature;

use App\Enums\ServiceRequestStatus;
use App\Models\ServiceRequest;
use App\Models\User;
use Database\Seeders\DemoUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ServiceRequestAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private User $otherUser;

    private ServiceRequest $ownersRequest;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create();
        $this->otherUser = User::factory()->create();
        $this->ownersRequest = ServiceRequest::factory()
            ->for($this->owner)
            ->status(ServiceRequestStatus::Open)
            ->create(['title' => 'Owner only printer issue']);
    }

    public function test_user_cannot_view_another_users_request(): void
    {
        Sanctum::actingAs($this->otherUser);

        $this->getJson("/api/service-requests/{$this->ownersRequest->id}")
            ->assertForbidden()
            ->assertJsonPath('message', 'You do not have access to this service request.')
            ->assertJsonMissingPath('data');
    }

    public function test_user_cannot_change_status_of_another_users_request(): void
    {
        Sanctum::actingAs($this->otherUser);

        $this->patchJson("/api/service-requests/{$this->ownersRequest->id}/status", [
            'status' => 'in_progress',
            'version' => 1,
        ])->assertForbidden();

        $fresh = $this->ownersRequest->fresh();
        $this->assertSame(ServiceRequestStatus::Open, $fresh->status);
        $this->assertSame(1, $fresh->version);
        $this->assertSame(1, $this->ownersRequest->statusHistories()->count());
    }

    public function test_user_only_sees_own_requests_in_the_list(): void
    {
        ServiceRequest::factory()->count(2)->for($this->otherUser)->create();
        Sanctum::actingAs($this->otherUser);

        $response = $this->getJson('/api/service-requests')
            ->assertOk()
            ->assertJsonPath('meta.total', 2);

        $this->assertNotContains($this->ownersRequest->id, collect($response->json('data'))->pluck('id'));
    }

    public function test_search_and_filters_do_not_reveal_other_users_requests(): void
    {
        Sanctum::actingAs($this->otherUser);

        $this->getJson('/api/service-requests?search=Owner%20only&status=open')
            ->assertOk()
            ->assertJsonPath('meta.total', 0)
            ->assertJsonCount(0, 'data');
    }

    public function test_owner_can_view_and_update_own_request(): void
    {
        Sanctum::actingAs($this->owner);

        $this->getJson("/api/service-requests/{$this->ownersRequest->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $this->ownersRequest->id);

        $this->patchJson("/api/service-requests/{$this->ownersRequest->id}/status", [
            'status' => 'in_progress',
            'version' => 1,
        ])->assertOk();
    }

    public function test_admin_can_view_list_and_update_any_request(): void
    {
        $admin = User::factory()->admin()->create();
        ServiceRequest::factory()->for($this->otherUser)->create();
        Sanctum::actingAs($admin);

        $this->getJson('/api/service-requests')
            ->assertOk()
            ->assertJsonPath('meta.total', 2);

        $this->getJson("/api/service-requests/{$this->ownersRequest->id}")->assertOk();

        $this->patchJson("/api/service-requests/{$this->ownersRequest->id}/status", [
            'status' => 'in_progress',
            'version' => 1,
        ])
            ->assertOk()
            ->assertJsonPath('data.status_history.0.changed_by.id', $admin->id);
    }

    public function test_profile_reports_admin_flag(): void
    {
        $this->seed(DemoUserSeeder::class);

        Sanctum::actingAs(User::where('email', 'admin@example.com')->first());
        $this->getJson('/api/me')->assertOk()->assertJsonPath('data.is_admin', true);

        Sanctum::actingAs(User::where('email', 'user@example.com')->first());
        $this->getJson('/api/me')->assertOk()->assertJsonPath('data.is_admin', false);
    }
}

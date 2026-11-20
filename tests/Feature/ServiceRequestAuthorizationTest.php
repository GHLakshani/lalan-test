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

        $this->getJson("/api/requests/{$this->ownersRequest->id}")
            ->assertForbidden()
            ->assertJsonPath('message', 'You do not have access to this service request.')
            ->assertJsonMissingPath('data');
    }

    public function test_user_cannot_change_status_of_another_users_request(): void
    {
        Sanctum::actingAs($this->otherUser);

        $this->patchJson("/api/requests/{$this->ownersRequest->id}/status", [
            'status' => 'IN_PROGRESS',
            'expected_version' => 1,
        ])->assertForbidden();

        $fresh = $this->ownersRequest->fresh();
        $this->assertSame(ServiceRequestStatus::Open, $fresh->status);
        $this->assertSame(1, $fresh->version);
        $this->assertSame(1, $this->ownersRequest->statusHistories()->count());
    }

    public function test_user_cannot_read_another_users_status_history(): void
    {
        Sanctum::actingAs($this->owner);
        $this->patchJson("/api/requests/{$this->ownersRequest->id}/status", [
            'status' => 'IN_PROGRESS',
            'expected_version' => 1,
            'remark' => 'Private remark from the owner',
        ])->assertOk();

        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($this->otherUser);

        $detail = $this->getJson("/api/requests/{$this->ownersRequest->id}")
            ->assertForbidden()
            ->assertJsonMissingPath('data.status_history');
        $this->assertStringNotContainsString('Private remark from the owner', $detail->getContent());

        $history = $this->getJson("/api/requests/{$this->ownersRequest->id}/history")
            ->assertForbidden()
            ->assertJsonPath('message', 'You do not have access to this service request.')
            ->assertJsonMissingPath('data');
        $this->assertStringNotContainsString('Private remark from the owner', $history->getContent());

        $stale = $this->patchJson("/api/requests/{$this->ownersRequest->id}/status", [
            'status' => 'RESOLVED',
            'expected_version' => 1,
        ])->assertForbidden();
        $this->assertStringNotContainsString('Private remark from the owner', $stale->getContent());

        $list = $this->getJson('/api/requests')->assertOk()->assertJsonPath('meta.total', 0);
        $this->assertStringNotContainsString('Private remark from the owner', $list->getContent());

        $this->assertSame(2, $this->ownersRequest->statusHistories()->count());
    }

    public function test_user_only_sees_own_requests_in_the_list(): void
    {
        ServiceRequest::factory()->count(2)->for($this->otherUser)->create();
        Sanctum::actingAs($this->otherUser);

        $response = $this->getJson('/api/requests')
            ->assertOk()
            ->assertJsonPath('meta.total', 2);

        $this->assertNotContains($this->ownersRequest->id, collect($response->json('data'))->pluck('id'));
    }

    public function test_search_and_filters_do_not_reveal_other_users_requests(): void
    {
        Sanctum::actingAs($this->otherUser);

        $this->getJson('/api/requests?search=Owner%20only&status=OPEN')
            ->assertOk()
            ->assertJsonPath('meta.total', 0)
            ->assertJsonCount(0, 'data');
    }

    public function test_owner_can_view_and_update_own_request(): void
    {
        Sanctum::actingAs($this->owner);

        $this->getJson("/api/requests/{$this->ownersRequest->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $this->ownersRequest->id);

        $this->patchJson("/api/requests/{$this->ownersRequest->id}/status", [
            'status' => 'IN_PROGRESS',
            'expected_version' => 1,
        ])->assertOk();
    }

    public function test_admin_cannot_read_or_change_other_users_requests(): void
    {
        $admin = User::factory()->admin()->create();
        $adminsRequest = ServiceRequest::factory()->for($admin)->create();
        ServiceRequest::factory()->for($this->otherUser)->create();
        Sanctum::actingAs($admin);

        $this->getJson('/api/requests')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $adminsRequest->id);

        $this->getJson("/api/requests/{$this->ownersRequest->id}")
            ->assertForbidden()
            ->assertJsonMissingPath('data');

        $this->patchJson("/api/requests/{$this->ownersRequest->id}/status", [
            'status' => 'IN_PROGRESS',
            'expected_version' => 1,
        ])->assertForbidden();

        $fresh = $this->ownersRequest->fresh();
        $this->assertSame(ServiceRequestStatus::Open, $fresh->status);
        $this->assertSame(1, $fresh->version);
        $this->assertSame(1, $this->ownersRequest->statusHistories()->count());
    }

    public function test_profile_reports_admin_flag(): void
    {
        $this->seed(DemoUserSeeder::class);

        Sanctum::actingAs(User::where('email', 'admin@example.com')->first());
        $this->getJson('/api/auth/me')->assertOk()->assertJsonPath('data.is_admin', true);

        Sanctum::actingAs(User::where('email', 'user@example.com')->first());
        $this->getJson('/api/auth/me')->assertOk()->assertJsonPath('data.is_admin', false);
    }
}

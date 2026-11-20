<?php

namespace Tests\Feature;

use App\Enums\Permission;
use App\Enums\ServiceRequestStatus;
use App\Models\ServiceRequest;
use App\Models\User;
use Database\Seeders\DemoUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PermissionTest extends TestCase
{
    use RefreshDatabase;

    private function newRequestPayload(): array
    {
        return [
            'title' => 'Projector not working',
            'description' => 'No signal from the meeting room projector.',
            'priority' => 'MEDIUM',
        ];
    }

    public function test_user_without_create_permission_cannot_create_requests(): void
    {
        Sanctum::actingAs(User::factory()->withPermissions(Permission::ChangeRequestStatus)->create());

        $this->postJson('/api/requests', $this->newRequestPayload())
            ->assertForbidden()
            ->assertJsonPath('message', 'You do not have permission to create service requests.');

        $this->assertDatabaseCount('service_requests', 0);
    }

    public function test_user_with_create_permission_can_create_requests(): void
    {
        Sanctum::actingAs(User::factory()->withPermissions(Permission::CreateRequests)->create());

        $this->postJson('/api/requests', $this->newRequestPayload())->assertCreated();
    }

    public function test_user_without_change_status_permission_cannot_change_own_request_status(): void
    {
        $user = User::factory()->withPermissions(Permission::CreateRequests)->create();
        $serviceRequest = ServiceRequest::factory()->for($user)->status(ServiceRequestStatus::Open)->create();
        Sanctum::actingAs($user);

        $this->getJson("/api/requests/{$serviceRequest->id}")->assertOk();

        $this->patchJson("/api/requests/{$serviceRequest->id}/status", ['status' => 'IN_PROGRESS', 'expected_version' => 1])
            ->assertForbidden()
            ->assertJsonPath('message', 'You do not have permission to change the status of service requests.');

        $this->assertSame(ServiceRequestStatus::Open, $serviceRequest->fresh()->status);
        $this->assertSame(1, $serviceRequest->statusHistories()->count());
    }

    public function test_user_with_change_status_permission_can_change_own_request_status(): void
    {
        $user = User::factory()->withPermissions(Permission::ChangeRequestStatus)->create();
        $serviceRequest = ServiceRequest::factory()->for($user)->status(ServiceRequestStatus::Open)->create();
        Sanctum::actingAs($user);

        $this->patchJson("/api/requests/{$serviceRequest->id}/status", ['status' => 'IN_PROGRESS', 'expected_version' => 1])
            ->assertOk()
            ->assertJsonPath('data.status_history.0.actor.id', $user->id);
    }

    public function test_change_status_permission_never_grants_access_to_other_users_requests(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->withPermissions(Permission::CreateRequests, Permission::ChangeRequestStatus)->create();
        $serviceRequest = ServiceRequest::factory()->for($owner)->status(ServiceRequestStatus::Open)->create();
        Sanctum::actingAs($other);

        $this->patchJson("/api/requests/{$serviceRequest->id}/status", ['status' => 'IN_PROGRESS', 'expected_version' => 1])
            ->assertForbidden()
            ->assertJsonPath('message', 'You do not have access to this service request.');

        $this->assertSame(ServiceRequestStatus::Open, $serviceRequest->fresh()->status);
        $this->assertSame(1, $serviceRequest->statusHistories()->count());
    }

    public function test_permission_changes_take_effect_immediately(): void
    {
        $admin = User::factory()->admin()->create();
        $member = User::factory()->withPermissions(Permission::CreateRequests)->create();
        $token = $member->createToken('api')->plainTextToken;

        $this->withToken($token)->postJson('/api/requests', $this->newRequestPayload())->assertCreated();

        Sanctum::actingAs($admin);
        $this->putJson("/api/users/{$member->id}", [
            'name' => $member->name,
            'email' => $member->email,
            'role' => 'member',
            'permissions' => [],
        ])->assertOk()->assertJsonPath('data.permissions', []);

        $this->app['auth']->forgetGuards();

        $this->withToken($token)->postJson('/api/requests', $this->newRequestPayload())->assertForbidden();
        $this->withToken($token)->getJson('/api/auth/me')->assertOk()->assertJsonPath('data.permissions', []);
    }

    public function test_demo_accounts_have_expected_permissions(): void
    {
        $this->seed(DemoUserSeeder::class);

        $admin = User::where('email', 'admin@example.com')->firstOrFail();
        $user = User::where('email', 'user@example.com')->firstOrFail();

        $this->assertSame(2, User::count());
        $this->assertTrue($admin->isAdmin());
        $this->assertSame(Permission::values(Permission::cases()), $admin->effectivePermissions());
        $this->assertFalse($user->isAdmin());
        $this->assertSame(['requests.create', 'requests.change_status'], $user->effectivePermissions());
    }
}

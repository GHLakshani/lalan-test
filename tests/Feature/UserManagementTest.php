<?php

namespace Tests\Feature;

use App\Enums\Permission;
use App\Enums\ServiceRequestStatus;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create(['name' => 'Alice Admin']);
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'New Member',
            'email' => 'new.member@example.com',
            'password' => 'secret-pass',
            'password_confirmation' => 'secret-pass',
            'role' => 'member',
            'permissions' => ['requests.create'],
        ], $overrides);
    }

    public function test_guest_cannot_manage_users(): void
    {
        $this->getJson('/api/users')->assertUnauthorized();
        $this->postJson('/api/users', $this->validPayload())->assertUnauthorized();
    }

    public function test_member_cannot_manage_users(): void
    {
        $member = User::factory()->create();
        $other = User::factory()->create();
        Sanctum::actingAs($member);

        $this->getJson('/api/users')
            ->assertForbidden()
            ->assertJsonPath('message', 'Only administrators can manage users.');
        $this->getJson("/api/users/{$other->id}")->assertForbidden();
        $this->postJson('/api/users', $this->validPayload())->assertForbidden();
        $this->putJson("/api/users/{$other->id}", $this->validPayload(['email' => $other->email]))->assertForbidden();
        $this->deleteJson("/api/users/{$other->id}")->assertForbidden();

        $this->assertDatabaseMissing('users', ['email' => 'new.member@example.com']);
        $this->assertNotSoftDeleted($other);
    }

    public function test_admin_can_list_and_search_users(): void
    {
        User::factory()->create(['name' => 'Bob Member', 'email' => 'bob@example.com']);
        User::factory()->create(['name' => 'Carol Member', 'email' => 'carol@example.com']);
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/users')
            ->assertOk()
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('data.0.name', 'Alice Admin')
            ->assertJsonPath('data.0.role', 'admin')
            ->assertJsonPath('data.0.permissions', Permission::values(Permission::cases()))
            ->assertJsonStructure(['data' => [['id', 'name', 'email', 'role', 'is_admin', 'permissions', 'service_requests_count']]]);

        $this->getJson('/api/users?search=carol')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.email', 'carol@example.com');

        $this->getJson('/api/users?role=admin')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_admin_can_create_a_member_who_can_then_log_in(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/users', $this->validPayload())
            ->assertCreated()
            ->assertJsonPath('data.name', 'New Member')
            ->assertJsonPath('data.role', 'member')
            ->assertJsonPath('data.permissions', ['requests.create'])
            ->assertJsonMissingPath('data.password');

        $user = User::where('email', 'new.member@example.com')->firstOrFail();
        $this->assertTrue(Hash::check('secret-pass', $user->password));
        $this->assertFalse($user->isAdmin());

        $this->postJson('/api/auth/login', ['email' => 'new.member@example.com', 'password' => 'secret-pass'])
            ->assertOk()
            ->assertJsonPath('user.permissions', ['requests.create']);
    }

    public function test_admin_can_create_another_admin_with_all_permissions(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/users', $this->validPayload(['role' => 'admin', 'permissions' => []]))
            ->assertCreated()
            ->assertJsonPath('data.is_admin', true)
            ->assertJsonPath('data.permissions', Permission::values(Permission::cases()));
    }

    public function test_create_user_validates_input(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/users', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password', 'role']);

        $this->postJson('/api/users', $this->validPayload([
            'email' => $this->admin->email,
            'password' => 'short',
            'password_confirmation' => 'different',
            'role' => 'owner',
            'permissions' => ['requests.delete'],
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password', 'role', 'permissions.0'])
            ->assertJsonPath('errors.email.0', 'A user with this email address already exists.');
    }

    public function test_admin_can_update_details_permissions_and_password(): void
    {
        $member = User::factory()->create(['email' => 'member@example.com']);
        Sanctum::actingAs($this->admin);

        $this->putJson("/api/users/{$member->id}", [
            'name' => 'Renamed Member',
            'email' => 'renamed@example.com',
            'role' => 'member',
            'permissions' => ['requests.change_status'],
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Renamed Member')
            ->assertJsonPath('data.email', 'renamed@example.com')
            ->assertJsonPath('data.permissions', ['requests.change_status']);

        $this->assertTrue(Hash::check('password', $member->fresh()->password));

        $this->putJson("/api/users/{$member->id}", [
            'name' => 'Renamed Member',
            'email' => 'renamed@example.com',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
            'role' => 'admin',
        ])
            ->assertOk()
            ->assertJsonPath('data.role', 'admin');

        $fresh = $member->fresh();
        $this->assertTrue(Hash::check('new-password', $fresh->password));
        $this->assertTrue($fresh->isAdmin());
    }

    public function test_admin_cannot_remove_own_admin_role(): void
    {
        Sanctum::actingAs($this->admin);

        $this->putJson("/api/users/{$this->admin->id}", [
            'name' => 'Alice Admin',
            'email' => $this->admin->email,
            'role' => 'member',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['role'])
            ->assertJsonPath('errors.role.0', 'You cannot remove your own administrator role.');

        $this->assertTrue($this->admin->fresh()->isAdmin());
    }

    public function test_admin_can_update_own_name(): void
    {
        Sanctum::actingAs($this->admin);

        $this->putJson("/api/users/{$this->admin->id}", [
            'name' => 'Alice Renamed',
            'email' => $this->admin->email,
            'role' => 'admin',
        ])->assertOk()->assertJsonPath('data.name', 'Alice Renamed');
    }

    public function test_admin_cannot_delete_own_account(): void
    {
        Sanctum::actingAs($this->admin);

        $this->deleteJson("/api/users/{$this->admin->id}")
            ->assertForbidden()
            ->assertJsonPath('message', 'You cannot delete your own account.');

        $this->assertNotSoftDeleted($this->admin);
    }

    public function test_deleting_a_user_revokes_access_but_keeps_their_requests_and_history(): void
    {
        $member = User::factory()->create(['name' => 'Leaving Member']);
        $token = $member->createToken('api')->plainTextToken;
        $serviceRequest = ServiceRequest::factory()->for($member)->status(ServiceRequestStatus::Open)->create();

        Sanctum::actingAs($this->admin);
        $this->deleteJson("/api/users/{$member->id}")->assertNoContent();

        $this->assertSoftDeleted($member);
        $this->assertSame(0, $member->tokens()->count());
        $this->assertDatabaseHas('service_requests', ['id' => $serviceRequest->id]);

        $kept = ServiceRequest::with(['user', 'statusHistories.actor'])->findOrFail($serviceRequest->id);
        $this->assertSame('Leaving Member', $kept->user->name);
        $this->assertSame('Leaving Member', $kept->statusHistories->first()->actor->name);

        $this->getJson("/api/requests/{$serviceRequest->id}")->assertForbidden();

        $this->getJson('/api/users')->assertJsonPath('meta.total', 1);
        $this->getJson("/api/users/{$member->id}")->assertNotFound();

        $this->app['auth']->forgetGuards();

        $this->withToken($token)->getJson('/api/auth/me')->assertUnauthorized();
        $this->postJson('/api/auth/login', ['email' => $member->email, 'password' => 'password'])
            ->assertUnprocessable();
    }

    public function test_permissions_endpoint_lists_available_permissions(): void
    {
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/permissions')
            ->assertOk()
            ->assertJsonCount(count(Permission::cases()), 'data')
            ->assertJsonPath('data.0.value', 'requests.create')
            ->assertJsonPath('data.0.default', true)
            ->assertJsonPath('data.1.value', 'requests.change_status')
            ->assertJsonPath('data.1.default', true)
            ->assertJsonStructure(['data' => [['value', 'label', 'description', 'default']]]);
    }
}

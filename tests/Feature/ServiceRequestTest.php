<?php

namespace Tests\Feature;

use App\Enums\ServiceRequestPriority;
use App\Enums\ServiceRequestStatus;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ServiceRequestTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
    }

    public function test_guest_cannot_access_service_requests(): void
    {
        $this->getJson('/api/requests')->assertUnauthorized();
        $this->postJson('/api/requests', [])->assertUnauthorized();
        $this->getJson('/api/requests/1')->assertUnauthorized();
    }

    public function test_user_can_create_service_request(): void
    {
        Sanctum::actingAs($this->user);

        $this->postJson('/api/requests', [
            'title' => 'Printer not working',
            'description' => 'The printer on the second floor shows a paper jam error.',
            'priority' => 'HIGH',
        ])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Printer not working')
            ->assertJsonPath('data.priority.value', 'HIGH')
            ->assertJsonPath('data.priority.label', 'High')
            ->assertJsonPath('data.status.value', 'OPEN')
            ->assertJsonPath('data.requested_by.id', $this->user->id);

        $this->assertDatabaseHas('service_requests', [
            'created_by' => $this->user->id,
            'title' => 'Printer not working',
            'priority' => 'HIGH',
            'status' => 'OPEN',
        ]);
    }

    public function test_create_ignores_status_and_owner_from_input(): void
    {
        Sanctum::actingAs($this->user);
        $other = User::factory()->create();

        $this->postJson('/api/requests', [
            'title' => 'Laptop battery',
            'description' => 'Battery drains quickly.',
            'priority' => 'LOW',
            'status' => 'RESOLVED',
            'created_by' => $other->id,
        ])
            ->assertCreated()
            ->assertJsonPath('data.status.value', 'OPEN')
            ->assertJsonPath('data.requested_by.id', $this->user->id);
    }

    public function test_create_validates_input(): void
    {
        Sanctum::actingAs($this->user);

        $this->postJson('/api/requests', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'description', 'priority']);

        $this->postJson('/api/requests', [
            'title' => str_repeat('a', 256),
            'description' => 'Valid description',
            'priority' => 'critical',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'priority']);

        $this->assertDatabaseCount('service_requests', 0);
    }

    public function test_create_enforces_title_and_description_lengths(): void
    {
        Sanctum::actingAs($this->user);

        $this->postJson('/api/requests', [
            'title' => 'ab',
            'description' => 'Too short',
            'priority' => 'LOW',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'description']);

        $this->postJson('/api/requests', [
            'title' => str_repeat('a', 101),
            'description' => str_repeat('b', 501),
            'priority' => 'LOW',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'description']);

        $this->postJson('/api/requests', [
            'title' => 'abc',
            'description' => str_repeat('b', 10),
            'priority' => 'LOW',
        ])->assertCreated();

        $this->postJson('/api/requests', [
            'title' => str_repeat('a', 100),
            'description' => str_repeat('b', 500),
            'priority' => 'HIGH',
        ])->assertCreated();

        $this->assertDatabaseCount('service_requests', 2);
    }

    public function test_priority_values_follow_the_contract(): void
    {
        Sanctum::actingAs($this->user);

        foreach (['urgent', 'high', 'CRITICAL'] as $priority) {
            $this->postJson('/api/requests', [
                'title' => 'Printer not working',
                'description' => 'Office printer stopped responding.',
                'priority' => $priority,
            ])
                ->assertUnprocessable()
                ->assertJsonValidationErrors(['priority']);
        }

        $this->postJson('/api/requests', [
            'title' => 'Printer not working',
            'description' => 'Office printer stopped responding.',
            'priority' => 'HIGH',
        ])
            ->assertCreated()
            ->assertJsonPath('data.priority.value', 'HIGH')
            ->assertJsonPath('data.status.value', 'OPEN')
            ->assertJsonPath('data.version', 1);
    }

    public function test_user_can_view_service_request(): void
    {
        Sanctum::actingAs($this->user);
        $serviceRequest = ServiceRequest::factory()->for($this->user)->create();

        $this->getJson("/api/requests/{$serviceRequest->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $serviceRequest->id)
            ->assertJsonPath('data.title', $serviceRequest->title)
            ->assertJsonPath('data.description', $serviceRequest->description)
            ->assertJsonPath('data.requested_by.name', $this->user->name);
    }

    public function test_viewing_missing_service_request_returns_not_found(): void
    {
        Sanctum::actingAs($this->user);

        $this->getJson('/api/requests/999')->assertNotFound();
    }

    public function test_index_returns_paginated_results(): void
    {
        Sanctum::actingAs($this->user);
        ServiceRequest::factory()->count(15)->for($this->user)->create();

        $this->getJson('/api/requests')
            ->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.total', 15)
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonStructure([
                'data' => [['id', 'title', 'description', 'priority', 'status', 'requested_by', 'created_at']],
                'links' => ['first', 'last', 'prev', 'next'],
                'meta' => ['current_page', 'from', 'last_page', 'per_page', 'to', 'total'],
            ]);

        $this->getJson('/api/requests?page=2')
            ->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.current_page', 2);
    }

    public function test_index_respects_per_page(): void
    {
        Sanctum::actingAs($this->user);
        ServiceRequest::factory()->count(30)->for($this->user)->create();

        $this->getJson('/api/requests?per_page=25')
            ->assertOk()
            ->assertJsonCount(25, 'data')
            ->assertJsonPath('meta.last_page', 2);

        $this->getJson('/api/requests?per_page=26')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('per_page');
    }

    public function test_index_returns_newest_first(): void
    {
        Sanctum::actingAs($this->user);
        $older = ServiceRequest::factory()->for($this->user)->create(['created_at' => now()->subDay()]);
        $newer = ServiceRequest::factory()->for($this->user)->create();

        $this->getJson('/api/requests')
            ->assertJsonPath('data.0.id', $newer->id)
            ->assertJsonPath('data.1.id', $older->id);
    }

    public function test_index_can_search_by_title(): void
    {
        Sanctum::actingAs($this->user);
        ServiceRequest::factory()->for($this->user)->create(['title' => 'Printer paper jam']);
        ServiceRequest::factory()->for($this->user)->create(['title' => 'Replace office PRINTER toner']);
        ServiceRequest::factory()->for($this->user)->create(['title' => 'Email not syncing']);

        $response = $this->getJson('/api/requests?search=printer')
            ->assertOk()
            ->assertJsonPath('meta.total', 2);

        $titles = collect($response->json('data'))->pluck('title');
        $this->assertTrue($titles->contains('Printer paper jam'));
        $this->assertTrue($titles->contains('Replace office PRINTER toner'));
    }

    public function test_index_can_filter_by_priority(): void
    {
        Sanctum::actingAs($this->user);
        ServiceRequest::factory()->count(3)->for($this->user)->priority(ServiceRequestPriority::High)->create();
        ServiceRequest::factory()->count(2)->for($this->user)->priority(ServiceRequestPriority::Low)->create();

        $response = $this->getJson('/api/requests?priority=HIGH')
            ->assertOk()
            ->assertJsonPath('meta.total', 3);

        $this->assertSame(['HIGH'], collect($response->json('data'))->pluck('priority.value')->unique()->values()->all());
    }

    public function test_index_can_filter_by_status(): void
    {
        Sanctum::actingAs($this->user);
        ServiceRequest::factory()->count(4)->for($this->user)->status(ServiceRequestStatus::Resolved)->create();
        ServiceRequest::factory()->count(2)->for($this->user)->status(ServiceRequestStatus::Open)->create();

        $response = $this->getJson('/api/requests?status=RESOLVED')
            ->assertOk()
            ->assertJsonPath('meta.total', 4);

        $this->assertSame(['RESOLVED'], collect($response->json('data'))->pluck('status.value')->unique()->values()->all());
    }

    public function test_index_can_combine_search_and_filters(): void
    {
        Sanctum::actingAs($this->user);
        $match = ServiceRequest::factory()->for($this->user)->create([
            'title' => 'VPN connection drops',
            'priority' => ServiceRequestPriority::High,
            'status' => ServiceRequestStatus::InProgress,
        ]);
        ServiceRequest::factory()->for($this->user)->create([
            'title' => 'VPN access for new hire',
            'priority' => ServiceRequestPriority::Low,
            'status' => ServiceRequestStatus::InProgress,
        ]);
        ServiceRequest::factory()->for($this->user)->create([
            'title' => 'VPN slow',
            'priority' => ServiceRequestPriority::High,
            'status' => ServiceRequestStatus::Resolved,
        ]);

        $this->getJson('/api/requests?search=vpn&priority=HIGH&status=IN_PROGRESS')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $match->id);
    }

    public function test_index_rejects_invalid_filters(): void
    {
        Sanctum::actingAs($this->user);

        $this->getJson('/api/requests?priority=critical&status=pending')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['priority', 'status']);
    }

    public function test_pagination_links_keep_filters(): void
    {
        Sanctum::actingAs($this->user);
        ServiceRequest::factory()->count(12)->for($this->user)->priority(ServiceRequestPriority::High)->create();

        $next = $this->getJson('/api/requests?priority=HIGH&per_page=5')
            ->assertOk()
            ->json('links.next');

        $this->assertStringContainsString('priority=HIGH', $next);
        $this->assertStringContainsString('per_page=5', $next);
        $this->assertStringContainsString('page=2', $next);
    }
}

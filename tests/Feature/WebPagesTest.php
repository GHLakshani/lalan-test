<?php

namespace Tests\Feature;

use Tests\TestCase;

class WebPagesTest extends TestCase
{
    public function test_home_redirects_to_login(): void
    {
        $this->get('/')->assertRedirect('/login');
    }

    public function test_login_page_is_rendered(): void
    {
        $this->get('/login')
            ->assertOk()
            ->assertViewIs('auth.login')
            ->assertSee('css/app.css')
            ->assertSee('js/app.js')
            ->assertSee('js/auth.js');
    }

    public function test_profile_page_is_rendered(): void
    {
        $this->get('/profile')
            ->assertOk()
            ->assertViewIs('profile');
    }

    public function test_service_request_index_page_is_rendered_with_filters(): void
    {
        $this->get('/service-requests')
            ->assertOk()
            ->assertViewIs('service-requests.index')
            ->assertSee('js/service-requests.js')
            ->assertSee('value="urgent"', false)
            ->assertSee('value="in_progress"', false);
    }

    public function test_service_request_create_page_is_rendered(): void
    {
        $this->get('/service-requests/create')
            ->assertOk()
            ->assertViewIs('service-requests.create');
    }

    public function test_service_request_show_page_is_rendered(): void
    {
        $this->get('/service-requests/5')
            ->assertOk()
            ->assertViewIs('service-requests.show')
            ->assertSee('data-request-id="5"', false);
    }

    public function test_service_request_show_page_requires_numeric_id(): void
    {
        $this->get('/service-requests/abc')->assertNotFound();
    }
}

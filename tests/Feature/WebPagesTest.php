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
}

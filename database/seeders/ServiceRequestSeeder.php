<?php

namespace Database\Seeders;

use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Database\Seeder;

class ServiceRequestSeeder extends Seeder
{
    public function run(): void
    {
        User::whereIn('email', ['admin@example.com', 'user@example.com'])
            ->get()
            ->each(function (User $user) {
                if ($user->serviceRequests()->exists()) {
                    return;
                }

                ServiceRequest::factory()
                    ->count(20)
                    ->for($user)
                    ->create();
            });
    }
}

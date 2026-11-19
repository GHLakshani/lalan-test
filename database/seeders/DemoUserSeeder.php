<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DemoUserSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            ['name' => 'Demo Admin', 'email' => 'admin@example.com', 'is_admin' => true],
            ['name' => 'Demo User', 'email' => 'user@example.com', 'is_admin' => false],
        ];

        foreach ($accounts as $account) {
            $user = User::updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'password' => 'password',
                    'email_verified_at' => now(),
                ],
            );

            $user->forceFill(['is_admin' => $account['is_admin']])->save();
        }
    }
}

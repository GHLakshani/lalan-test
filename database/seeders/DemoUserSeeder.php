<?php

namespace Database\Seeders;

use App\Enums\Permission;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoUserSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            [
                'name' => 'Demo Admin',
                'email' => 'admin@example.com',
                'is_admin' => true,
                'permissions' => [],
            ],
            [
                'name' => 'Demo User',
                'email' => 'user@example.com',
                'is_admin' => false,
                'permissions' => Permission::defaults(),
            ],
        ];

        foreach ($accounts as $account) {
            $user = User::withTrashed()->updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'password' => 'password',
                    'email_verified_at' => now(),
                ],
            );

            $user->assignRole($account['is_admin'], $account['permissions']);
            $user->deleted_at = null;
            $user->save();
        }
    }
}

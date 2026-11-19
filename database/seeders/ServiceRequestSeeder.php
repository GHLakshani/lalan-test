<?php

namespace Database\Seeders;

use App\Enums\ServiceRequestStatus;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

class ServiceRequestSeeder extends Seeder
{
    private const WORKFLOW = [
        ServiceRequestStatus::Open,
        ServiceRequestStatus::InProgress,
        ServiceRequestStatus::Resolved,
        ServiceRequestStatus::Closed,
    ];

    public function run(): void
    {
        $users = User::whereIn('email', ['admin@example.com', 'user@example.com'])->get();
        $agent = $users->firstWhere('email', 'admin@example.com') ?? $users->first();

        try {
            $users->each(function (User $user) use ($agent) {
                if ($user->serviceRequests()->exists()) {
                    return;
                }

                for ($count = 0; $count < 20; $count++) {
                    $this->seedRequest($user, $agent);
                }
            });
        } finally {
            Carbon::setTestNow();
            Auth::forgetUser();
        }
    }

    private function seedRequest(User $owner, User $agent): void
    {
        $finalStatus = fake()->randomElement(self::WORKFLOW);
        $steps = array_slice(self::WORKFLOW, 1, array_search($finalStatus, self::WORKFLOW, true));
        $time = Carbon::now()->subDays(fake()->numberBetween(8, 45))->subMinutes(fake()->numberBetween(0, 1440));

        Carbon::setTestNow($time);
        Auth::setUser($owner);

        $serviceRequest = ServiceRequest::factory()
            ->for($owner)
            ->status(ServiceRequestStatus::Open)
            ->create();

        foreach ($steps as $status) {
            $time = $time->copy()->addHours(fake()->numberBetween(2, 48));

            Carbon::setTestNow($time);
            Auth::setUser($agent);

            $serviceRequest->update(['status' => $status]);
        }

        Carbon::setTestNow();
    }
}

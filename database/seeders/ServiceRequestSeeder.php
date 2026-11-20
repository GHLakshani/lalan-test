<?php

namespace Database\Seeders;

use App\Actions\ChangeServiceRequestStatus;
use App\Enums\ServiceRequestStatus;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

class ServiceRequestSeeder extends Seeder
{
    private const REMARKS = [
        ServiceRequestStatus::InProgress->value => [
            'Assigned to the support team.',
            'Looking into this now.',
            'Waiting on parts, work has started.',
            null,
        ],
        ServiceRequestStatus::Resolved->value => [
            'Issue fixed and confirmed with the requester.',
            'Replaced the faulty part.',
            'Configuration updated, working as expected.',
            null,
        ],
    ];

    public function __construct(private readonly ChangeServiceRequestStatus $changeStatus)
    {
    }

    public function run(): void
    {
        $users = User::whereIn('email', ['admin@example.com', 'user@example.com'])->get();

        try {
            $users->each(function (User $user) {
                if ($user->serviceRequests()->exists()) {
                    return;
                }

                for ($count = 0; $count < 20; $count++) {
                    $this->seedRequest($user);
                }
            });
        } finally {
            Carbon::setTestNow();
            Auth::forgetUser();
        }
    }

    private function seedRequest(User $owner): void
    {
        $finalStatus = fake()->randomElement(ServiceRequestStatus::cases());
        $time = Carbon::now()->subDays(fake()->numberBetween(8, 45))->subMinutes(fake()->numberBetween(0, 1440));

        Carbon::setTestNow($time);
        Auth::setUser($owner);

        $serviceRequest = ServiceRequest::factory()
            ->for($owner)
            ->status(ServiceRequestStatus::Open)
            ->create();

        while ($serviceRequest->status !== $finalStatus) {
            $next = $serviceRequest->status->next();
            $time = $time->copy()->addHours(fake()->numberBetween(2, 48));

            Carbon::setTestNow($time);

            $serviceRequest = $this->changeStatus->handle(
                $serviceRequest,
                $next,
                $serviceRequest->version,
                $owner,
                fake()->randomElement(self::REMARKS[$next->value]),
            );
        }

        Carbon::setTestNow();
    }
}

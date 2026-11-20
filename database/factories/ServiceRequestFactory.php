<?php

namespace Database\Factories;

use App\Enums\ServiceRequestPriority;
use App\Enums\ServiceRequestStatus;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ServiceRequestFactory extends Factory
{
    protected $model = ServiceRequest::class;

    private const TITLES = [
        'Printer not working on second floor',
        'Laptop battery drains quickly',
        'Cannot connect to office Wi-Fi',
        'VPN connection keeps dropping',
        'Request new monitor',
        'Email not syncing on mobile',
        'Password reset for HR portal',
        'Air conditioning too cold in meeting room',
        'Projector not detecting HDMI input',
        'Install accounting software',
        'Keyboard keys sticking',
        'Shared drive access request',
        'Desk phone has no dial tone',
        'Replace printer toner',
        'Slow computer performance',
        'Broken chair in reception',
        'Software license renewal',
        'Set up workstation for new hire',
        'Website contact form not sending emails',
        'Leaking tap in pantry',
    ];

    public function definition(): array
    {
        return [
            'created_by' => User::factory(),
            'title' => fake()->randomElement(self::TITLES),
            'description' => Str::limit(fake()->paragraph(4), 480, ''),
            'priority' => fake()->randomElement(ServiceRequestPriority::cases()),
            'status' => fake()->randomElement(ServiceRequestStatus::cases()),
        ];
    }

    public function priority(ServiceRequestPriority $priority): static
    {
        return $this->state(fn () => ['priority' => $priority]);
    }

    public function status(ServiceRequestStatus $status): static
    {
        return $this->state(fn () => ['status' => $status]);
    }
}

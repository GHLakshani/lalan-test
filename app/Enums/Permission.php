<?php

namespace App\Enums;

enum Permission: string
{
    case CreateRequests = 'requests.create';
    case ChangeRequestStatus = 'requests.change_status';

    public function label(): string
    {
        return match ($this) {
            self::CreateRequests => 'Create requests',
            self::ChangeRequestStatus => 'Change request status',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::CreateRequests => 'Submit new service requests.',
            self::ChangeRequestStatus => 'Move their own requests through the Open, In Progress and Resolved workflow.',
        };
    }

    public static function defaults(): array
    {
        return [self::CreateRequests, self::ChangeRequestStatus];
    }

    public static function values(array $permissions): array
    {
        return array_map(fn (self $permission) => $permission->value, $permissions);
    }
}

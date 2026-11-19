<?php

namespace App\Enums;

enum Permission: string
{
    case CreateRequests = 'requests.create';
    case ViewAllRequests = 'requests.view_all';
    case ChangeRequestStatus = 'requests.change_status';

    public function label(): string
    {
        return match ($this) {
            self::CreateRequests => 'Create requests',
            self::ViewAllRequests => 'View all requests',
            self::ChangeRequestStatus => 'Change request status',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::CreateRequests => 'Submit new service requests.',
            self::ViewAllRequests => 'See and open service requests created by every user, not only their own.',
            self::ChangeRequestStatus => 'Move requests they can see through the Open, In Progress and Resolved workflow.',
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

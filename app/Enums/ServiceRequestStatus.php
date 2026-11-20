<?php

namespace App\Enums;

enum ServiceRequestStatus: string
{
    case Open = 'OPEN';
    case InProgress = 'IN_PROGRESS';
    case Resolved = 'RESOLVED';

    public function label(): string
    {
        return match ($this) {
            self::Open => 'Open',
            self::InProgress => 'In Progress',
            self::Resolved => 'Resolved',
        };
    }

    public function next(): ?self
    {
        return match ($this) {
            self::Open => self::InProgress,
            self::InProgress => self::Resolved,
            self::Resolved => null,
        };
    }

    public function canTransitionTo(self $status): bool
    {
        return $this->next() === $status;
    }

    public function isFinal(): bool
    {
        return $this->next() === null;
    }
}

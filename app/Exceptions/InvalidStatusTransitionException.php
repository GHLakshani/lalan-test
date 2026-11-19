<?php

namespace App\Exceptions;

use App\Enums\ServiceRequestStatus;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class InvalidStatusTransitionException extends RuntimeException
{
    public function __construct(
        public readonly ServiceRequestStatus $from,
        public readonly ServiceRequestStatus $to,
    ) {
        parent::__construct(self::describe($from, $to));
    }

    public static function describe(ServiceRequestStatus $from, ServiceRequestStatus $to): string
    {
        if ($from->isFinal()) {
            return "This request is already {$from->label()}. Its status can no longer be changed.";
        }

        if ($from === $to) {
            return "This request is already {$from->label()}.";
        }

        return "Cannot change status from {$from->label()} to {$to->label()}. The next allowed status is {$from->next()->label()}.";
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'errors' => [
                'status' => [$this->getMessage()],
            ],
        ], 422);
    }
}

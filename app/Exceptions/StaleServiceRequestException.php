<?php

namespace App\Exceptions;

use App\Http\Resources\ServiceRequestResource;
use App\Models\ServiceRequest;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class StaleServiceRequestException extends RuntimeException
{
    public function __construct(
        public readonly int $expectedVersion,
        public readonly int $currentVersion,
        public readonly int $serviceRequestId,
    ) {
        parent::__construct(
            "This request was updated by someone else. You were editing version {$expectedVersion}, but the current version is {$currentVersion}."
        );
    }

    public function render(): JsonResponse
    {
        $current = ServiceRequest::with(['user', 'statusHistories.changedBy'])->find($this->serviceRequestId);

        return response()->json([
            'message' => $this->getMessage(),
            'current_version' => $this->currentVersion,
            'data' => $current ? ServiceRequestResource::make($current)->resolve() : null,
        ], 409);
    }
}

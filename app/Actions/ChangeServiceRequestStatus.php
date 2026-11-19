<?php

namespace App\Actions;

use App\Enums\ServiceRequestStatus;
use App\Exceptions\InvalidStatusTransitionException;
use App\Exceptions\StaleServiceRequestException;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ChangeServiceRequestStatus
{
    public function handle(
        ServiceRequest $serviceRequest,
        ServiceRequestStatus $status,
        int $expectedVersion,
        ?User $changedBy = null,
        ?string $remark = null,
    ): ServiceRequest {
        return DB::transaction(function () use ($serviceRequest, $status, $expectedVersion, $changedBy, $remark) {
            $current = ServiceRequest::query()
                ->whereKey($serviceRequest->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            if ($current->version !== $expectedVersion) {
                throw new StaleServiceRequestException($expectedVersion, $current->version, $current->id);
            }

            if (! $current->status->canTransitionTo($status)) {
                throw new InvalidStatusTransitionException($current->status, $status);
            }

            $newVersion = $expectedVersion + 1;

            $updated = ServiceRequest::query()
                ->whereKey($current->getKey())
                ->where('version', $expectedVersion)
                ->update([
                    'status' => $status->value,
                    'version' => $newVersion,
                    'updated_at' => $current->freshTimestamp(),
                ]);

            if ($updated !== 1) {
                $latestVersion = (int) ServiceRequest::query()->whereKey($current->getKey())->value('version');

                throw new StaleServiceRequestException($expectedVersion, $latestVersion, $current->id);
            }

            $current->statusHistories()->create([
                'from_status' => $current->status,
                'to_status' => $status,
                'version' => $newVersion,
                'remark' => filled($remark) ? trim($remark) : null,
                'changed_by' => $changedBy?->getKey(),
            ]);

            return $current->refresh();
        });
    }
}

<?php

namespace App\Models;

use App\Enums\ServiceRequestPriority;
use App\Enums\ServiceRequestStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Auth;
use LogicException;

#[Fillable(['title', 'description', 'priority'])]
class ServiceRequest extends Model
{
    use HasFactory;

    protected $attributes = [
        'status' => 'open',
        'version' => 1,
    ];

    protected static function booted(): void
    {
        static::updating(function (ServiceRequest $serviceRequest) {
            if ($serviceRequest->isDirty('status')) {
                throw new LogicException('Service request status can only be changed through the ChangeServiceRequestStatus action.');
            }

            $serviceRequest->version = (int) $serviceRequest->getOriginal('version') + 1;
        });

        static::created(function (ServiceRequest $serviceRequest) {
            $serviceRequest->statusHistories()->create([
                'from_status' => null,
                'to_status' => $serviceRequest->status,
                'version' => $serviceRequest->version,
                'changed_by' => Auth::id() ?? $serviceRequest->user_id,
            ]);
        });
    }

    protected function casts(): array
    {
        return [
            'priority' => ServiceRequestPriority::class,
            'status' => ServiceRequestStatus::class,
            'version' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(ServiceRequestStatusHistory::class)
            ->latest()
            ->latest('id');
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (blank($term)) {
            return $query;
        }

        return $query->where('title', 'like', '%'.trim($term).'%');
    }

    public function scopePriority(Builder $query, ?string $priority): Builder
    {
        return $query->when($priority, fn (Builder $q) => $q->where('priority', $priority));
    }

    public function scopeStatus(Builder $query, ?string $status): Builder
    {
        return $query->when($status, fn (Builder $q) => $q->where('status', $status));
    }
}

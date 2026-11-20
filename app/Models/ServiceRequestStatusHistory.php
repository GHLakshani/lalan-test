<?php

namespace App\Models;

use App\Enums\ServiceRequestStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['from_status', 'to_status', 'version', 'remark', 'actor_user_id'])]
class ServiceRequestStatusHistory extends Model
{
    const UPDATED_AT = null;

    protected $table = 'request_status_histories';

    protected function casts(): array
    {
        return [
            'from_status' => ServiceRequestStatus::class,
            'to_status' => ServiceRequestStatus::class,
            'version' => 'integer',
        ];
    }

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id')->withTrashed();
    }
}

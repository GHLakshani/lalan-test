<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StatusHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'from_status' => $this->from_status ? [
                'value' => $this->from_status->value,
                'label' => $this->from_status->label(),
            ] : null,
            'to_status' => [
                'value' => $this->to_status->value,
                'label' => $this->to_status->label(),
            ],
            'version' => $this->version,
            'remark' => $this->remark,
            'changed_by' => $this->whenLoaded('changedBy', fn () => $this->changedBy ? [
                'id' => $this->changedBy->id,
                'name' => $this->changedBy->name,
            ] : null),
            'created_at' => $this->created_at,
        ];
    }
}

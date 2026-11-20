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
            'actor' => $this->whenLoaded('actor', fn () => $this->actor ? [
                'id' => $this->actor->id,
                'name' => $this->actor->name,
            ] : null),
            'created_at' => $this->created_at,
        ];
    }
}

<?php

namespace App\Http\Requests\ServiceRequest;

use App\Enums\ServiceRequestPriority;
use App\Enums\ServiceRequestStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexServiceRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'priority' => ['nullable', Rule::enum(ServiceRequestPriority::class)],
            'status' => ['nullable', Rule::enum(ServiceRequestStatus::class)],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:25'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}

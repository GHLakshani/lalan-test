<?php

namespace App\Http\Requests\ServiceRequest;

use App\Enums\ServiceRequestStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServiceRequestStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(ServiceRequestStatus::class)],
            'expected_version' => ['required', 'integer', 'min:1'],
            'remark' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'expected_version.required' => 'The version of the request you are updating is required.',
        ];
    }
}

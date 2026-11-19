<?php

namespace App\Http\Requests\User;

use App\Enums\Permission;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Validator;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $user = $this->route('user');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user)],
            'password' => ['nullable', 'string', 'confirmed', Password::min(8)],
            'role' => ['required', Rule::in(['admin', 'member'])],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['distinct', Rule::enum(Permission::class)],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'A user with this email address already exists.',
            'role.in' => 'The role must be either admin or member.',
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $user = $this->route('user');

                if ($user instanceof User && $this->user()?->is($user) && $this->input('role') !== 'admin') {
                    $validator->errors()->add('role', 'You cannot remove your own administrator role.');
                }
            },
        ];
    }
}

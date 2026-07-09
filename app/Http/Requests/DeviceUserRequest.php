<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DeviceUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'string', 'max:20'],
            'name' => ['required', 'string', 'max:100'],
            'password' => ['nullable', 'string', 'max:20'],
            'card_number' => ['nullable', 'string', 'max:20'],
            'privilege' => ['nullable', 'string', 'in:user,admin'],
        ];
    }
}

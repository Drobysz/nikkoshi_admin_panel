<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateArticleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title'     => ['sometimes', 'string'],
            'subtitle'  => ['sometimes', 'string'],
            'type'      => ['sometimes', 'string'],
            'year'      => ['sometimes', 'numeric'],
            'author_id' => ['sometimes', 'exists:users,id'],
            'cover'     => ['sometimes', 'image', 'max:104240', 'mimes:jpg,jpeg,png'],
        ];
    }
}

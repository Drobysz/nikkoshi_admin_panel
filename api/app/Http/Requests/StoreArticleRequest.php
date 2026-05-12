<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreArticleRequest extends FormRequest
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
            'title'     => ['required', 'string'],
            'subtitle'  => ['required', 'string'],
            'type'      => ['required', 'string'],
            'year'      => ['required', 'numeric'],
            'author_id' => ['required', 'exists:users,id'],
            'cover'     => ['required', 'image', 'max:104240', 'mimes:jpg,jpeg,png'],

            'paragraphs' => ['sometimes', 'array'],
            'paragraphs.*.title' => ['required', 'string'],
            'paragraphs.*.text' => ['required', 'string'],
            'paragraphs.*.order' => ['required', 'integer'],

            'timelines' => ['sometimes', 'array'],
            'timelines.*.year' => ['required', 'numeric'],
            'timelines.*.event' => ['required', 'string'],

        ];
    }
}

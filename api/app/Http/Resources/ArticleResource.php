<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArticleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'title'      => $this->title,
            'subtitle'   => $this->subtitle,
            'year'       => $this->year,
            'type'       => $this->type,
            'created_at' => $this->created_at,
            'author'     => $this->whenLoaded('author', function () {
                return [
                    'id'    => $this->author->id,
                    'name'  => $this->author->name,
                ];
            }),
            'img_url'    => $this->image_url,
            'paragraphs' => $this->whenLoaded('paragraphs', function () {
                return $this->paragraphs->map(function ($paragraph) {
                    return [
                        'id'    => $paragraph->id,
                        'title' => $paragraph->title,
                        'text'  => $paragraph->text,
                        'order' => $paragraph->order,
                    ];
                });
            }),
            'timelines' => $this->whenLoaded('timelines', function () {
                return $this->timelines->map(function ($timeline) {
                    return [
                        'id'    => $timeline->id,
                        'year'  => $timeline->year,
                        'event' => $timeline->event,
                    ];
                });
            })
        ];
    }
}

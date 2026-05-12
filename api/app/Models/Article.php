<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;


#[Fillable(['title', 'subtitle', 'year', 'type', 'author_id'])]
class Article extends Model
{
    protected $table = 'articles';

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        $directory = "covers/{$this->id}";
        $files = Storage::disk('s3')->files($directory);

        if (empty($files)) {
            return null;
        }

        return Storage::disk('s3')->url($files[0]);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function paragraphs(): HasMany
    {
        return $this->hasMany(Paragraph::class);
    }

    public function timelines(): HasMany
    {
        return $this->hasMany(Timeline::class);
    }
}

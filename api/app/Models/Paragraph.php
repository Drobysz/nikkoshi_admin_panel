<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['title', 'text', 'order'])]
class Paragraph extends Model
{
    public $timestamps = false;
    protected $table = 'paragraphs';

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

}

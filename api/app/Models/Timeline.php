<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['year', 'event'])]
class Timeline extends Model
{
    public $timestamps = false;
    protected $table = 'timelines';

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }
}

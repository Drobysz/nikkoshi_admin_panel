<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;
use App\Http\Requests\{
    StoreArticleRequest,
    UpdateArticleRequest
};
use App\Http\Resources\ArticleResource;
use App\Models\Article;
use Illuminate\Http\Request;

class ArticleController extends Controller
{
    public function index()
    {
        $articles = Article::with(['author', 'paragraphs', 'timelines'])->get();
        return ArticleResource::collection($articles);
    }

    public function show(Article $article)
    {
        $article->load(['author', 'paragraphs', 'timelines']);
        return new ArticleResource($article);
    }

    public function store(StoreArticleRequest $request)
    {
        $data = $request->validated();

        $paragraphs = $data['paragraphs'] ?? [];
        $timelines = $data['timelines'] ?? [];

        unset($data['cover'], $data['paragraphs'], $data['timelines']);
        $article = Article::query()->create($data);

        if (!empty($paragraphs)) {
            $article->paragraphs()->createMany($paragraphs);
        }

        if (!empty($timelines)) {
            $article->timelines()->createMany($timelines);
        }

        if ($request->hasFile('cover')) {
            $file = $request->file('cover');
            $path = "covers/{$article->id}";

            Storage::disk('s3')->putFileAs(
                $path,
                $file,
                'cover.' . $file->getClientOriginalExtension(),
            );
        }

        $article->load(['author', 'paragraphs', 'timelines']);

        return (new ArticleResource($article))
            ->additional([
                'msg' => 'Article created successfully',
            ])
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateArticleRequest $request, Article $article)
    {
        $data = $request->validated();
        unset($data['cover']);
        $article->update($data);

        if ($request->hasFile('cover')) {
            $file = $request->file('cover');
            $path = "covers/{$article->id}";

            Storage::disk('s3')->deleteDirectory(
                $path
            );

            Storage::disk('s3')->putFileAs(
                $path,
                $file,
                'cover.' . $file->getClientOriginalExtension(),
                'public'
            );
        }

        $article->load(['author', 'paragraphs', 'timelines']);

        return (new ArticleResource($article))
            ->additional([
                'msg' => 'Article updated successfully'
            ])
            ->response()
            ->setStatusCode(200);
    }

    public function destroy(Article $article)
    {
        Storage::disk('s3')->deleteDirectory(
            "covers/{$article->id}"
        );
        $article->delete();

        return response()->noContent();
    }
}

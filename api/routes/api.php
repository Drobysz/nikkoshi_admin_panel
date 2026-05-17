<?php

use Illuminate\Support\Facades\Route;

// Controllers
use App\Http\Controllers\Api\{
    ArticleController,
    UserController,
    ParagraphController,
    TimelineController
};
Route::prefix('auth')->group(function () {
    Route::post('/register', [UserController::class, 'store']);
    Route::post('/login',    [UserController::class, 'login']);
    Route::post('/logout',   [UserController::class, 'logout'])
        ->middleware('auth:sanctum');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource(
        'users',
        UserController::class
    )->only(['index', 'show', 'update', 'destroy']);

    Route::apiResource(
        'articles',
        ArticleController::class
    );

    Route::post(
        'articles/{article}/paragraphs',
        [ParagraphController::class, 'store']
    );

    Route::post(
        'articles/{article}/timelines',
        [TimelineController::class, 'store']
    );

    Route::apiResource(
        'paragraphs',
        ParagraphController::class
    )->only(['update', 'destroy']);

    Route::apiResource(
        'timelines',
        TimelineController::class
    )->only(['update', 'destroy']);
});

// Fallback for undefined routes
Route::fallback(function () {
    return response()->json(["message" => "Not found"], 404);
});

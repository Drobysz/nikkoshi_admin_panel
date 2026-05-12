<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\{
    Paragraph,
    Article
};

class ParagraphController extends Controller
{
    public function store(Article $article, Request $request)
    {
        $data = $request->validate([
            'title'  => 'required|string',
            'text'   => 'required|string',
            'order'  => 'required|integer'
        ]);

        $paragraph = $article->paragraphs()->create($data);

        return response()->json([
            'msg' => 'Paragraph created successfully',
            'data' => $paragraph,
        ], 201);
    }

    public function update(Request $request, Paragraph $paragraph)
    {
        $data = $request->validate([
            'title' => 'sometimes|string',
            'text'  => 'sometimes|string',
            'order' => 'sometimes|integer'
        ]);

        $paragraph->update($data);

        return response()->json([
            'msg' => 'Paragraph updated successfully'
        ], 200);
    }

    public function destroy(Paragraph $paragraph)
    {
        $paragraph->delete();

        return response()->noContent();
    }
}

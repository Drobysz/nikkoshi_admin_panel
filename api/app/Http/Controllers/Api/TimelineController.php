<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\{
    Timeline,
    Article
};

class TimelineController extends Controller
{
    public function store(Article $article, Request $request)
    {
        $data = $request->validate([
            'year'  => 'required|numeric',
            'event' => 'required|string',
        ]);

        $timeline = $article->timelines()->create($data);

        return response()->json([
            'msg' => 'Timeline created successfully',
            'data' => $timeline,
        ], 201);

    }

    public function update(Request $request, Timeline $timeline )
    {
        $data = $request->validate([
            'year'  => 'sometimes|numeric',
            'event' => 'sometimes|string',
        ]);

        $timeline->update($data);

        return response()->json([
            'msg' => 'Timeline updated successfully',
        ], 200);
    }

    public function destroy(Timeline $timeline )
    {
        $timeline->delete();
        return response()->noContent();
    }
}

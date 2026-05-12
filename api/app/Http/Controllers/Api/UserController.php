<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use App\Http\Requests\{
    StoreUserRequest,
    UpdateUserRequest,
    LoginUserRequest,
};

class UserController extends Controller
{
    public function index()
    {
        return UserResource::collection(User::all());
    }

    public function show(User $user)
    {
        return new UserResource($user);
    }

    public function store(StoreUserRequest $request)
    {
        $data = $request->validated();
        $user = User::query()->create($data);

        return  (new UserResource($user))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $data = $request->validated();
        $user->update($data);

        return (new UserResource($user))
            ->response()
            ->setStatusCode(200);
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->noContent();
    }

    public function login(LoginUserRequest $request)
    {
        $data = $request->validated();
        $user = User::query()->where('name', $data['name'])->first();

        if ( !$user || !Hash::check($data['password'], $user->password) ){
            return response()->json([
                'error' => 'Your input credentials are incorrect'
            ], 401);
        }

        $token = $user->createToken('token')->plainTextToken;

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ], 200);

    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }
}

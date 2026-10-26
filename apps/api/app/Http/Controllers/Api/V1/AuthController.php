<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (User::query()->where('email', $data['email'])->exists()) {
            return $this->emailAlreadyTaken();
        }

        try {
            $user = new User;
            $user->name = $data['name'];
            $user->email = $data['email'];
            $user->password = $data['password'];
            $user->role = Role::Customer;
            $user->save();
        } catch (UniqueConstraintViolationException) {
            return $this->emailAlreadyTaken();
        }

        Auth::guard('web')->login($user);
        $request->session()->regenerate();
        $this->markSessionStart($request);

        return response()->json([
            'user' => new UserResource($user->refresh()),
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        if (! Auth::guard('web')->attempt($credentials)) {
            return response()->json([
                'message' => 'Email atau password salah.',
                'code' => 'INVALID_CREDENTIALS',
            ], 401);
        }

        $request->session()->regenerate();
        $this->markSessionStart($request);

        return response()->json([
            'user' => new UserResource($request->user()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(null, 204);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()),
        ]);
    }

    private function markSessionStart(Request $request): void
    {
        $request->session()->put('auth_started_at', now()->getTimestamp());
    }

    private function emailAlreadyTaken(): JsonResponse
    {
        return response()->json([
            'message' => 'Email sudah terdaftar.',
            'code' => 'EMAIL_TAKEN',
        ], 409);
    }
}

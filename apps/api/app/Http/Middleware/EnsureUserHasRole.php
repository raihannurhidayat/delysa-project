<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if ($user === null) {
            return response()->json([
                'message' => 'Unauthenticated.',
                'code' => 'UNAUTHENTICATED',
            ], 401);
        }

        $role = $user->role?->value;

        if ($role === null || ! in_array($role, $roles, true)) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses ke resource ini.',
                'code' => 'FORBIDDEN_ROLE',
            ], 403);
        }

        return $next($request);
    }
}

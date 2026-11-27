<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureSessionIsNotExpired
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() === null) {
            return $next($request);
        }

        $startedAt = $request->session()->get('auth_started_at');

        if (! is_int($startedAt)) {
            $request->session()->put('auth_started_at', now()->getTimestamp());

            return $next($request);
        }

        $absoluteMinutes = (int) config('session.absolute_lifetime', 43200);

        if (now()->getTimestamp() - $startedAt <= $absoluteMinutes * 60) {
            return $next($request);
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Sesi Anda telah berakhir. Silakan masuk kembali.',
            'code' => 'SESSION_EXPIRED',
        ], 401);
    }
}

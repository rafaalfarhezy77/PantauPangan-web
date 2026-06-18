<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * Mendukung sintaks:
     *   Route::middleware('role:superadmin')
     *   Route::middleware('role:admin-komoditas,superadmin')  ← multiple allowed roles
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        // Flatten: setiap argumen bisa berisi koma (contoh: "admin-komoditas,superadmin")
        $allowedRoles = [];
        foreach ($roles as $role) {
            foreach (explode(',', $role) as $r) {
                $allowedRoles[] = trim($r);
            }
        }

        if (! $request->user() || ! in_array($request->user()->role, $allowedRoles)) {
            abort(403, 'Akses tidak diizinkan. Anda tidak memiliki role yang sesuai.');
        }

        return $next($request);
    }
}


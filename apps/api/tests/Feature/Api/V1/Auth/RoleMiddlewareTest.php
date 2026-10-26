<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;

function registerRoleTestRoute(): void
{
    Route::middleware(['auth:sanctum', 'role:admin'])
        ->get('/api/v1/testing/admin-only', fn () => response()->json(['ok' => true]));
}

test('allows a user with the required role', function () {
    registerRoleTestRoute();

    $this->actingAs(User::factory()->admin()->create())
        ->withHeaders(spaHeaders())
        ->getJson('/api/v1/testing/admin-only')
        ->assertOk()
        ->assertJson(['ok' => true]);
});

test('denies a user without the required role', function () {
    registerRoleTestRoute();

    $this->actingAs(User::factory()->customer()->create())
        ->withHeaders(spaHeaders())
        ->getJson('/api/v1/testing/admin-only')
        ->assertForbidden()
        ->assertJsonPath('code', 'FORBIDDEN_ROLE');
});

test('rejects guests from role protected routes', function () {
    registerRoleTestRoute();

    $this->withHeaders(spaHeaders())
        ->getJson('/api/v1/testing/admin-only')
        ->assertUnauthorized();
});

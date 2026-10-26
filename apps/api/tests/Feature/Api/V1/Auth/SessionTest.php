<?php

use App\Models\User;

test('returns the authenticated user from me', function () {
    $user = User::factory()->storeOwner()->create();

    $this->actingAs($user)
        ->withHeaders(spaHeaders())
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonPath('user.role', 'store_owner')
        ->assertJsonMissingPath('user.password');
});

test('returns 401 from me for guests', function () {
    $this->withHeaders(spaHeaders())
        ->getJson('/api/v1/auth/me')
        ->assertUnauthorized();
});

test('logs out and clears the session', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withSession(['auth_started_at' => now()->getTimestamp()])
        ->withHeaders(spaHeaders())
        ->postJson('/api/v1/auth/logout')
        ->assertNoContent();

    $this->assertGuest('web');
});

test('rejects a session older than thirty days', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withSession(['auth_started_at' => now()->subDays(31)->getTimestamp()])
        ->withHeaders(spaHeaders())
        ->getJson('/api/v1/auth/me')
        ->assertUnauthorized()
        ->assertJsonPath('code', 'SESSION_EXPIRED');
});

test('accepts a session younger than thirty days', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withSession(['auth_started_at' => now()->subDays(29)->getTimestamp()])
        ->withHeaders(spaHeaders())
        ->getJson('/api/v1/auth/me')
        ->assertOk();
});

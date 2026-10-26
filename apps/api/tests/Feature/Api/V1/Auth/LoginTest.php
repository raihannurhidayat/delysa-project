<?php

use App\Models\User;

test('logs in with valid credentials', function () {
    $user = User::factory()->create([
        'email' => 'sinta@example.com',
        'password' => 'rahasia123',
    ]);

    $this->withHeaders(spaHeaders())->postJson('/api/v1/auth/login', [
        'email' => 'SINTA@example.com',
        'password' => 'rahasia123',
    ])
        ->assertOk()
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonPath('user.email', 'sinta@example.com')
        ->assertJsonMissingPath('user.password');

    $this->assertAuthenticatedAs($user);
});

test('rejects invalid credentials with a generic 401', function () {
    User::factory()->create([
        'email' => 'sinta@example.com',
        'password' => 'rahasia123',
    ]);

    $this->withHeaders(spaHeaders())->postJson('/api/v1/auth/login', [
        'email' => 'sinta@example.com',
        'password' => 'salah',
    ])
        ->assertUnauthorized()
        ->assertJsonPath('code', 'INVALID_CREDENTIALS')
        ->assertJsonPath('message', 'Email atau password salah.');
});

test('throttles failed logins after five attempts per minute', function () {
    User::factory()->create([
        'email' => 'sinta@example.com',
        'password' => 'rahasia123',
    ]);

    foreach (range(1, 5) as $attempt) {
        $this->withHeaders(spaHeaders())->postJson('/api/v1/auth/login', [
            'email' => 'sinta@example.com',
            'password' => 'salah',
        ])->assertUnauthorized();
    }

    $this->withHeaders(spaHeaders())->postJson('/api/v1/auth/login', [
        'email' => 'sinta@example.com',
        'password' => 'salah',
    ])->assertStatus(429);
});

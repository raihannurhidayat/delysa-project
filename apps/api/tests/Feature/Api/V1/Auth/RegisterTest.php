<?php

use App\Enums\Role;
use App\Models\User;

test('registers a customer and starts an authenticated session', function () {
    $response = $this->withHeaders(spaHeaders())->postJson('/api/v1/auth/register', [
        'name' => '  Sinta Ayu  ',
        'email' => '  SINTA@Example.COM ',
        'password' => 'rahasia123',
    ]);

    $response->assertCreated()
        ->assertJsonPath('user.name', 'Sinta Ayu')
        ->assertJsonPath('user.email', 'sinta@example.com')
        ->assertJsonPath('user.role', Role::Customer->value)
        ->assertJsonMissingPath('user.password');

    $user = User::query()->where('email', 'sinta@example.com')->firstOrFail();

    expect($user->role)->toBe(Role::Customer)
        ->and($user->email_verified_at)->toBeNull();

    $this->assertAuthenticatedAs($user);
});

test('rejects duplicate email with 409', function () {
    User::factory()->create(['email' => 'sinta@example.com']);

    $this->withHeaders(spaHeaders())->postJson('/api/v1/auth/register', [
        'name' => 'Sinta Ayu',
        'email' => 'SINTA@example.com',
        'password' => 'rahasia123',
    ])
        ->assertStatus(409)
        ->assertJsonPath('code', 'EMAIL_TAKEN');
});

test('validates registration input', function () {
    $this->withHeaders(spaHeaders())->postJson('/api/v1/auth/register', [
        'name' => 'S',
        'email' => 'not-an-email',
        'password' => 'short',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'email', 'password']);
});

test('ignores a client supplied role', function () {
    $this->withHeaders(spaHeaders())->postJson('/api/v1/auth/register', [
        'name' => 'Sinta Ayu',
        'email' => 'sinta@example.com',
        'password' => 'rahasia123',
        'role' => Role::Admin->value,
    ])->assertCreated();

    expect(User::query()->where('email', 'sinta@example.com')->firstOrFail()->role)
        ->toBe(Role::Customer);
});

<?php

namespace Database\Factories;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    public function configure(): static
    {
        return $this->afterMaking(function (User $user): void {
            if ($user->role === null) {
                $user->forceFill(['role' => Role::Customer]);
            }
        });
    }

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    public function customer(): static
    {
        return $this->afterMaking(
            fn (User $user) => $user->forceFill(['role' => Role::Customer]),
        );
    }

    public function storeOwner(): static
    {
        return $this->afterMaking(
            fn (User $user) => $user->forceFill(['role' => Role::StoreOwner]),
        );
    }

    public function admin(): static
    {
        return $this->afterMaking(
            fn (User $user) => $user->forceFill(['role' => Role::Admin]),
        );
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate that the model has two-factor authentication configured.
     */
    public function withTwoFactor(): static {}
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $topic
 * @property array<string, mixed>|null $payload
 * @property Carbon|null $created_at
 */
#[Fillable(['topic', 'payload', 'created_at'])]
class RealtimeEvent extends Model
{
    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'created_at' => 'datetime',
        ];
    }

    /**
     * Catat event perubahan domain agar klien SSE/live-sync langsung memperbarui UI.
     *
     * @param  array<string, mixed>  $payload
     */
    public static function publish(string $topic, array $payload = []): self
    {
        $event = self::query()->create([
            'topic' => $topic,
            'payload' => $payload,
            'created_at' => now(),
        ]);

        // ponytail: jaga tabel realtime_events tetap ringan (<= 200 baris); ganti ke Redis Pub/Sub / Laravel Reverb saat trafik tinggi.
        $cutoff = self::query()->orderByDesc('id')->skip(200)->value('id');
        if (is_numeric($cutoff)) {
            self::query()->where('id', '<=', (int) $cutoff)->delete();
        }

        return $event;
    }
}

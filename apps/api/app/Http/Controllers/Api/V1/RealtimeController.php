<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\RealtimeEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RealtimeController extends Controller
{
    public function events(Request $request): JsonResponse
    {
        $since = max(0, (int) $request->query('since', '0'));
        $latestId = (int) (RealtimeEvent::query()->max('id') ?? 0);

        if ($since === 0) {
            return response()->json([
                'latestId' => $latestId,
                'events' => [],
            ]);
        }

        $events = RealtimeEvent::query()
            ->where('id', '>', $since)
            ->orderBy('id')
            ->limit(50)
            ->get()
            ->map(static fn (RealtimeEvent $event): array => [
                'id' => $event->id,
                'topic' => $event->topic,
                'payload' => $event->payload ?? [],
                'at' => ($event->created_at ?? now())->toISOString(),
            ])
            ->values()
            ->all();

        return response()->json([
            'latestId' => $latestId,
            'events' => $events,
        ]);
    }

    public function stream(Request $request): StreamedResponse
    {
        $headerId = $request->header('Last-Event-ID');
        $since = is_numeric($headerId)
            ? max(0, (int) $headerId)
            : max(0, (int) $request->query('since', '0'));

        return response()->stream(function () use ($since): void {
            echo "retry: 2500\n\n";

            $cursor = $since > 0 ? $since : (int) (RealtimeEvent::query()->max('id') ?? 0);

            if ($since === 0) {
                echo "id: {$cursor}\n";
                echo "event: connected\n";
                echo 'data: '.json_encode(['latestId' => $cursor])."\n\n";
                $this->flushStream();
            }

            // Pada PHP built-in CLI server (single-threaded di Windows), hindari loop panjang agar tidak memblokir request API lain.
            $maxSeconds = PHP_SAPI === 'cli-server' ? 0 : 20;
            $deadline = time() + $maxSeconds;

            do {
                $events = RealtimeEvent::query()
                    ->where('id', '>', $cursor)
                    ->orderBy('id')
                    ->limit(30)
                    ->get();

                foreach ($events as $event) {
                    $cursor = $event->id;
                    $data = json_encode([
                        'id' => $event->id,
                        'topic' => $event->topic,
                        'payload' => $event->payload ?? [],
                        'at' => ($event->created_at ?? now())->toISOString(),
                    ]);
                    echo "id: {$cursor}\n";
                    echo "event: {$event->topic}\n";
                    echo "data: {$data}\n\n";
                }

                $this->flushStream();

                if ($maxSeconds === 0 || connection_aborted() === 1) {
                    break;
                }

                sleep(1);
            } while (time() < $deadline);
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache, no-transform',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    private function flushStream(): void
    {
        if (ob_get_level() > 0) {
            @ob_flush();
        }
        flush();
    }
}

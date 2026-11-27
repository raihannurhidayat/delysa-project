<?php

namespace App\Services;

use App\Exceptions\InsufficientStockException;
use App\Models\Order;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class StockService
{
    /**
     * Reserve stock for an array of items: [['product_id' => int, 'qty' => int], ...].
     * Must be called inside or wraps a DB transaction with row-level lock.
     *
     * @param  array<int, array{product_id: int, qty: int}>  $items
     */
    public function reserve(array $items): void
    {
        DB::transaction(function () use ($items): void {
            // Sort by product_id to prevent deadlocks
            usort($items, fn (array $a, array $b) => $a['product_id'] <=> $b['product_id']);

            foreach ($items as $item) {
                /** @var Product $product */
                $product = Product::query()
                    ->whereKey($item['product_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                $available = $product->availableStock();
                if ($available < $item['qty']) {
                    throw new InsufficientStockException(
                        $product->id,
                        $product->name,
                        $available,
                        $item['qty'],
                    );
                }

                $product->reserved_stock += $item['qty'];
                $product->save();
            }
        });
    }

    /**
     * Commit a verified sale: deduct both stock and reserved_stock, record 'sale' movement.
     */
    public function commitSale(Order $order, ?int $actorId = null): void
    {
        DB::transaction(function () use ($order, $actorId): void {
            $order->loadMissing('items');
            $items = $order->items->sortBy('product_id');

            foreach ($items as $item) {
                /** @var Product $product */
                $product = Product::query()
                    ->whereKey($item->product_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $product->stock = max(0, $product->stock - $item->qty);
                $product->reserved_stock = max(0, $product->reserved_stock - $item->qty);
                $product->sold_count += $item->qty;
                $product->save();

                StockMovement::query()->create([
                    'product_id' => $product->id,
                    'order_id' => $order->id,
                    'actor_id' => $actorId,
                    'type' => 'sale',
                    'qty_change' => -$item->qty,
                    'stock_after' => $product->stock,
                    'reason' => "Penjualan order {$order->code}",
                    'created_at' => now(),
                ]);
            }
        });
    }

    /**
     * Restore reserved stock on order cancellation or payment rejection.
     */
    public function restore(Order $order, ?int $actorId = null, string $reason = 'Pembatalan/Penolakan order'): void
    {
        DB::transaction(function () use ($order, $actorId, $reason): void {
            $order->loadMissing('items');
            $items = $order->items->sortBy('product_id');

            foreach ($items as $item) {
                /** @var Product $product */
                $product = Product::query()
                    ->whereKey($item->product_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $product->reserved_stock = max(0, $product->reserved_stock - $item->qty);
                $product->save();

                StockMovement::query()->create([
                    'product_id' => $product->id,
                    'order_id' => $order->id,
                    'actor_id' => $actorId,
                    'type' => 'restore',
                    'qty_change' => $item->qty,
                    'stock_after' => $product->stock,
                    'reason' => "{$reason} ({$order->code})",
                    'created_at' => now(),
                ]);
            }
        });
    }

    /**
     * Manual stock adjustment by admin/store owner.
     */
    public function adjust(Product $product, int $newStock, string $reason, ?int $actorId = null): Product
    {
        return DB::transaction(function () use ($product, $newStock, $reason, $actorId): Product {
            /** @var Product $locked */
            $locked = Product::query()->whereKey($product->id)->lockForUpdate()->firstOrFail();
            $delta = $newStock - $locked->stock;
            $locked->stock = max(0, $newStock);
            $locked->save();

            StockMovement::query()->create([
                'product_id' => $locked->id,
                'actor_id' => $actorId,
                'type' => $delta >= 0 ? 'in' : 'adjustment',
                'qty_change' => $delta,
                'stock_after' => $locked->stock,
                'reason' => $reason,
                'created_at' => now(),
            ]);

            return $locked;
        });
    }
}

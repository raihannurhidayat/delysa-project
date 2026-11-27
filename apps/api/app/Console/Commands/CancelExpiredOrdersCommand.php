<?php

namespace App\Console\Commands;

use App\Enums\OrderStatus;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\RealtimeEvent;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CancelExpiredOrdersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:cancel-expired-orders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Batalkan pesanan pending_payment yang melewati batas payment_deadline dan kembalikan stok produk.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $now = now();
        $expiredOrders = Order::query()
            ->with(['items'])
            ->where('status', OrderStatus::PendingPayment)
            ->whereNotNull('payment_deadline')
            ->where('payment_deadline', '<=', $now)
            ->get();

        if ($expiredOrders->isEmpty()) {
            $this->info('Tidak ada pesanan kedaluwarsa yang perlu dibatalkan.');

            return self::SUCCESS;
        }

        $cancelledCount = 0;
        $totalItemsRestored = 0;

        foreach ($expiredOrders as $order) {
            DB::transaction(function () use ($order, &$cancelledCount, &$totalItemsRestored): void {
                /** @var Order|null $lockedOrder */
                $lockedOrder = Order::query()->lockForUpdate()->find($order->id);

                if (! $lockedOrder || $lockedOrder->status !== OrderStatus::PendingPayment) {
                    return;
                }

                foreach ($lockedOrder->items as $item) {
                    $product = null;
                    if ($item->product_id !== null) {
                        $product = Product::query()->lockForUpdate()->find($item->product_id);
                    } elseif ($item->product_slug !== '') {
                        $product = Product::query()
                            ->whereRaw('LOWER(slug) = ?', [strtolower($item->product_slug)])
                            ->lockForUpdate()
                            ->first();
                    }

                    if ($product !== null) {
                        $product->increment('stock', $item->qty);
                        $product->update([
                            'sold' => max(0, $product->sold - $item->qty),
                        ]);
                        $totalItemsRestored += $item->qty;
                    }
                }

                $lockedOrder->status = OrderStatus::Cancelled;
                $lockedOrder->save();

                if ($lockedOrder->coupon_code !== null) {
                    Coupon::query()
                        ->whereRaw('UPPER(code) = ?', [strtoupper($lockedOrder->coupon_code)])
                        ->lockForUpdate()
                        ->first()
                        ?->decrementUsage();
                }

                $lockedOrder->timelines()->create([
                    'status' => OrderStatus::Cancelled->value,
                    'note' => 'Dibatalkan otomatis oleh sistem karena melewati batas waktu pembayaran.',
                    'created_at' => now(),
                ]);

                RealtimeEvent::publish('orders', [
                    'action' => 'status_updated',
                    'code' => $lockedOrder->code,
                    'status' => OrderStatus::Cancelled->value,
                ]);

                RealtimeEvent::publish('products', [
                    'action' => 'stock_restored',
                    'code' => $lockedOrder->code,
                ]);

                $cancelledCount++;
            });
        }

        $this->info("Berhasil membatalkan {$cancelledCount} pesanan kedaluwarsa. Total {$totalItemsRestored} unit stok dikembalikan ke katalog.");

        return self::SUCCESS;
    }
}

<?php

namespace App\Support;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderTimeline;
use Illuminate\Support\Facades\Storage;

final class OrderPresenter
{
    /**
     * @return array<string, mixed>
     */
    public static function toArray(Order $order): array
    {
        $order->loadMissing(['items', 'timelines']);

        $itemCount = (int) $order->items->sum('qty');
        $subtotalNormal = (int) $order->items->sum(
            static fn (OrderItem $item): int => ($item->original_price ?? $item->price) * $item->qty,
        );
        $productDiscount = max(0, $subtotalNormal - $order->subtotal);

        $proofUrl = $order->payment_proof_path
            ? Storage::disk('public')->url($order->payment_proof_path)
            : null;

        return [
            'id' => $order->id,
            'code' => $order->code,
            'status' => $order->status->value,
            'total' => $order->total,
            'createdAt' => ($order->created_at ?? now())->toISOString(),
            'updatedAt' => ($order->updated_at ?? now())->toISOString(),
            'paymentDeadline' => ($order->payment_deadline ?? now()->addDay())->toISOString(),
            'recipientName' => $order->recipient_name,
            'recipientPhone' => $order->recipient_phone,
            'shippingAddress' => $order->shipping_address,
            'customNote' => $order->custom_note,
            'paymentProofUrl' => $proofUrl,
            'paymentProofName' => $order->payment_proof_name,
            'courier' => $order->courier,
            'trackingNumber' => $order->tracking_number,
            'deliveredAt' => $order->delivered_at?->toISOString(),
            'items' => $order->items->map(static fn (OrderItem $item): array => [
                'slug' => $item->product_slug,
                'name' => $item->name,
                'price' => $item->price,
                'originalPrice' => $item->original_price,
                'image' => $item->image_url ?? 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&q=80&auto=format&fit=crop',
                'sizeId' => 'standard',
                'sizeLabel' => $item->variant_label ?? 'Standard',
                'wrapId' => 'standard',
                'qty' => $item->qty,
            ])->values()->all(),
            'totals' => [
                'itemCount' => $itemCount,
                'subtotalNormal' => $subtotalNormal,
                'productDiscount' => $productDiscount,
                'subtotal' => $order->subtotal,
                'shipping' => $order->shipping_cost,
                'packaging' => 0,
                'couponDiscount' => $order->discount,
                'grandTotal' => $order->total,
                'freeShipping' => $order->shipping_cost === 0,
                'remainingForFree' => max(0, 200000 - $order->subtotal),
            ],
            'payment' => self::paymentSnapshot($order->payment_method),
            'timeline' => $order->timelines->map(static fn (OrderTimeline $event): array => array_filter([
                'status' => $event->status,
                'at' => ($event->created_at ?? now())->toISOString(),
                'note' => $event->note,
            ], static fn (mixed $v): bool => $v !== null))->values()->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function paymentSnapshot(string $methodId): array
    {
        if ($methodId === 'qris') {
            return [
                'methodId' => 'qris',
                'label' => 'QRIS Delysa Florist',
                'description' => 'Scan QRIS resmi Delysa Florist via m-banking atau e-wallet.',
                'steps' => [
                    'Buka aplikasi m-banking atau e-wallet (GoPay, OVO, DANA, ShopeePay).',
                    'Scan QRIS resmi Delysa Florist lalu masukkan nominal persis sesuai total pesanan.',
                    'Unggah tangkapan layar bukti bayar untuk verifikasi admin.',
                ],
            ];
        }

        return [
            'methodId' => 'manual_transfer_bca',
            'label' => 'Transfer Bank BCA',
            'description' => 'Transfer manual ke rekening resmi BCA a.n. Kartinah.',
            'bank' => [
                'name' => 'BCA',
                'accountNumber' => '054-082-9912',
                'accountName' => 'Kartinah',
            ],
            'steps' => [
                'Transfer tepat sesuai nominal total ke rekening BCA 054-082-9912 a.n. Kartinah.',
                'Simpan bukti transfer dari m-BCA / ATM.',
                'Unggah bukti transfer di halaman pesanan agar segera diverifikasi admin.',
            ],
        ];
    }
}

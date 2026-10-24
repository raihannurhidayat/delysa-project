import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "~/components/ui/drawer";
import { formatIDR } from "~/features/shop/lib/format";
import {
  FREE_SHIPPING_MIN,
  SHIPPING_FLAT,
} from "~/features/shop/lib/cart-rules";
import type { MiniCartLine } from "~/features/shop/types";

/**
 * Drawer kanan "Berhasil Ditambahkan" (Image 1): fokus trap + Esc/backdrop
 * via Base UI modal default. Navigasi checkout ke `/keranjang`.
 */
export function MiniCartDrawer({
  open,
  onOpenChange,
  lines,
  subtotal,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lines: MiniCartLine[];
  subtotal: number;
}) {
  const last = lines[lines.length - 1];
  const shipping =
    subtotal >= FREE_SHIPPING_MIN || subtotal === 0 ? 0 : SHIPPING_FLAT;
  const total = subtotal + shipping;
  const count = lines.reduce((n, l) => n + l.qty, 0);

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => onOpenChange(v)}
      swipeDirection="right"
    >
      <DrawerContent aria-label="Keranjang mini">
        <div className="flex items-center justify-between gap-2">
          <DrawerTitle className="flex items-center gap-1.5 text-sm font-bold text-[#1A1A1A]">
            <CheckCircle2
              size={16}
              aria-hidden="true"
              className="text-emerald-600"
            />
            Berhasil Ditambahkan
          </DrawerTitle>
        </div>
        <DrawerDescription className="text-xs">
          Foto rangkaian pesanan akan dikirim melalui WhatsApp untuk verifikasi
          kualitas sebelum pengiriman.
        </DrawerDescription>
        {last ? (
          <div className="flex gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-3">
            <img
              src={last.image}
              alt=""
              width={80}
              height={100}
              loading="lazy"
              decoding="async"
              className="h-20 w-16 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-[#1A1A1A]">
                {last.name}
              </p>
              <p className="text-[11px] text-[#6B7280]">
                Varian: {last.sizeLabel} ({last.qty} Tangkai)
              </p>
              <p className="mt-0.5 text-xs font-bold tabular-nums">
                {formatIDR(last.price)} × {last.qty}
              </p>
            </div>
          </div>
        ) : null}
        <dl className="flex flex-col gap-1 border-t border-[#E5E7EB] pt-3 text-xs">
          <div className="flex justify-between">
            <dt className="text-[#6B7280]">Subtotal ({count} item)</dt>
            <dd className="font-semibold tabular-nums">
              {formatIDR(subtotal)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#6B7280]">
              Estimasi Ongkir (Kota Tasikmalaya)
            </dt>
            <dd className="font-semibold text-emerald-700">
              {shipping === 0 ? "GRATIS" : formatIDR(shipping)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-[#E5E7EB] pt-2 text-sm">
            <dt className="font-bold">Total Sementara</dt>
            <dd className="font-extrabold tabular-nums">{formatIDR(total)}</dd>
          </div>
        </dl>
        <div className="mt-auto flex flex-col gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 w-full rounded-lg"
          >
            Lanjut Belanja
          </Button>
          <Button
            type="button"
            render={<Link to="/keranjang" />}
            onClick={() => onOpenChange(false)}
            className="h-11 w-full rounded-lg bg-[#111111] text-white hover:bg-[#2A2A2A]"
          >
            Lihat Keranjang ({count}) →
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

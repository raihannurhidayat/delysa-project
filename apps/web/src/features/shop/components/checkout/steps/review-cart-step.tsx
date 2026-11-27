"use client";

import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "~/components/ui/button";
import { CartLineItem } from "~/features/shop/components/cart/cart-line-item";
import { FreeShippingProgress } from "~/features/shop/components/cart/free-shipping-progress";
import { lineKey } from "~/features/shop/lib/cart-rules";
import type { MiniCartLine } from "~/features/shop/types";

interface ReviewCartStepProps {
  lines: MiniCartLine[];
  onQtyChange: (key: string, qty: number) => void;
  onRemove: (key: string) => void;
  onNext: () => void;
}

export function ReviewCartStep({
  lines,
  onQtyChange,
  onRemove,
  onNext,
}: ReviewCartStepProps) {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);

  return (
    <section aria-labelledby="checkout-review-heading" className="space-y-4">
      <div>
        <h2
          id="checkout-review-heading"
          className="text-lg font-extrabold tracking-tight text-[#1A1A1A]"
        >
          Review Keranjang
        </h2>
        <p className="mt-0.5 text-sm text-[#6B7280]">
          Periksa jumlah dan varian sebelum melanjutkan ke alamat pengiriman.
        </p>
      </div>

      {lines.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-white p-6 text-center">
          <ShoppingBag
            size={32}
            className="mx-auto text-[#D1D5DB]"
            aria-hidden="true"
          />
          <p className="mt-2 text-sm font-medium text-[#1A1A1A]">
            Keranjang masih kosong
          </p>
          <p className="mt-1 text-xs text-[#6B7280]">
            Tambahkan rangkaian dulu sebelum checkout.
          </p>
          <Button
            render={<Link to="/katalog" />}
            className="mt-4 rounded-full bg-[#111111] text-white hover:bg-[#2A2A2A]"
          >
            Jelajahi Katalog
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {lines.map((line) => {
              const key = lineKey(line);
              return (
                <CartLineItem
                  key={key}
                  line={line}
                  selected
                  onSelectedChange={() => undefined}
                  onQtyChange={(qty) => onQtyChange(key, qty)}
                  onRemove={() => onRemove(key)}
                  onSaveLater={() => undefined}
                  showSelection={false}
                  showSaveLater={false}
                />
              );
            })}
          </div>

          <FreeShippingProgress subtotal={subtotal} />
        </>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          render={<Link to="/keranjang" />}
          className="rounded-full text-[#6B7280] hover:bg-[#F3F4F6]"
        >
          <ArrowLeft size={16} aria-hidden="true" className="mr-1" />
          Kembali ke Keranjang
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={lines.length === 0}
          className="rounded-full bg-[#111111] text-white hover:bg-[#2A2A2A] disabled:bg-[#D1D5DB] disabled:text-[#9CA3AF]"
        >
          Lanjut ke Alamat
          <ArrowRight size={16} aria-hidden="true" className="ml-1" />
        </Button>
      </div>
    </section>
  );
}

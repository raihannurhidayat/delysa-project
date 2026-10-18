import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronLeft,
  Minus,
  Plus,
  RotateCcw,
  Save,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Camera,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { formatIDR } from "~/features/shop/lib/format";
import { QuantityStepper } from "~/features/shop/components/product/quantity-stepper";
import { useMiniCart } from "~/features/shop/hooks/use-mini-cart";
import { toast } from "~/components/ui/toast";
import { CartLineItem } from "~/features/shop/components/cart/cart-line-item";
import { CartSelectBar } from "~/features/shop/components/cart/cart-select-bar";
import { FreeShippingProgress } from "~/features/shop/components/cart/free-shipping-progress";
import { CartInstructionsField } from "~/features/shop/components/cart/cart-instructions-field";
import { OrderSummary } from "~/features/shop/components/cart/order-summary";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
import { AtelierAddons } from "~/features/shop/components/cart/atelier-addons";
import { SavedForLater } from "~/features/shop/components/cart/saved-for-later";
import { GuestBanner } from "~/features/shop/components/cart/guest-banner";
import { DeliverySlotNote } from "~/features/shop/components/cart/delivery-slot-note";

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: "TRANSFER RESMI BCA",
    subtitle: "Pembayaran aman a.n. Kartinah",
  },
  {
    icon: Truck,
    title: "TEPAT WAKTU",
    subtitle: "Pengiriman sesuai jadwal",
  },
  {
    icon: Camera,
    title: "KONFIRMASI FOTO VIA WA",
    subtitle: "Pratinjau sebelum kurir jalan",
  },
];

export default function CartPage({
  demo,
}: {
  demo?: "loading" | "empty" | "error";
}) {
  const {
    lines,
    saved,
    coupon,
    instructions,
    count,
    totals,
    updateQty,
    remove,
    removeMany,
    saveForLater,
    moveToCart,
    removeSaved,
    applyCoupon,
    removeCoupon,
    setInstructions,
    add: addLine,
  } = useMiniCart();

  const navigate = useNavigate({ from: "/keranjang" });
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const lineKeys = lines.map(
    (l) => `${l.kind ?? "product"}:${l.slug}:${l.sizeId}:${l.wrapId}`,
  );
  const allSelected =
    lineKeys.length > 0 && lineKeys.every((k) => selectedKeys.includes(k));
  const someSelected = selectedKeys.length > 0 && !allSelected;

  const toggleAll = () => {
    setSelectedKeys(allSelected || someSelected ? [] : lineKeys);
  };

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleDeleteSelected = () => {
    if (selectedKeys.length === 0) return;
    const removedLines = lines.filter((l) =>
      selectedKeys.includes(
        `${l.kind ?? "product"}:${l.slug}:${l.sizeId}:${l.wrapId}`,
      ),
    );
    removeMany(selectedKeys);
    setSelectedKeys([]);
    // Undo toast
    if (removedLines.length > 0) {
      toast.add({
        title: "Item dihapus",
        description: removedLines.map((l) => l.name).join(", "),
        type: "info",
        actionProps: {
          children: "Urungkan",
          onClick: () => {
            removedLines.forEach((l) => {
              addLine({
                slug: l.slug,
                name: l.name,
                image: l.image,
                sizeId: l.sizeId,
                sizeLabel: l.sizeLabel,
                wrapId: l.wrapId,
                price: l.price,
                qty: l.qty,
                note: l.note,
                kind: l.kind,
                originalPrice: l.originalPrice,
                bonuses: l.bonuses,
                maxQty: l.maxQty,
                wrapLabel: l.wrapLabel,
              });
            });
          },
        },
      });
    }
  };

  // Sync selection when lines change
  useEffect(() => {
    setSelectedKeys((prev) => prev.filter((k) => lineKeys.includes(k)));
    if (lineKeys.length > 0 && prevLineKeys.current.length === 0) {
      setSelectedKeys(lineKeys);
    }
  }, [lineKeys]);

  const prevLineKeys = useRef<string[]>([]);
  useEffect(() => {
    prevLineKeys.current = lineKeys;
  }, [lineKeys]);

  // Demo states
  if (demo === "error") {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Alert variant="destructive" className="mx-auto max-w-md">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          <AlertTitle className="text-base font-bold text-[#1A1A1A]">
            Gagal memuat keranjang
          </AlertTitle>
          <AlertDescription className="text-sm text-[#6B7280]">
            Periksa koneksi lalu coba lagi.
          </AlertDescription>
          <Button
            type="button"
            onClick={() => navigate({ search: {}, replace: true })}
            className="mt-4 rounded-full bg-[#111111] text-white hover:bg-[#2A2A2A]"
          >
            <RotateCcw size={16} aria-hidden="true" /> Coba lagi
          </Button>
        </Alert>
      </main>
    );
  }

  const isLoading = demo === "loading";
  const isEmpty = demo === "empty" || lines.length === 0;

  if (isEmpty && !isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Breadcrumb className="pt-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/" />}>Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/katalog" />}>
                Shop
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Keranjang Belanja</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <ShoppingBag
            size={64}
            className="text-[#E5E7EB]"
            aria-hidden="true"
          />
          <div>
            <h1 className="text-xl font-extrabold text-[#1A1A1A]">
              Keranjang kosong
            </h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              Belum ada rangkaian di keranjang. Yuk temukan yang cocok!
            </p>
          </div>
          <Button className="mt-4 rounded-full bg-[#111111] text-white hover:bg-[#2A2A2A]">
            <Link to="/katalog">Jelajahi Katalog</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6" aria-busy="true">
        <Breadcrumb className="pt-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/" />}>Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/katalog" />}>
                Shop
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Keranjang Belanja</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 w-full space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3 animate-pulse"
              >
                <div className="h-20 w-20 shrink-0 rounded-lg bg-[#F3F4F6]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-[#F3F4F6] rounded" />
                  <div className="h-3 w-1/2 bg-[#F3F4F6] rounded" />
                  <div className="h-8 w-24 bg-[#F3F4F6] rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="min-w-0 lg:sticky lg:top-24 w-full space-y-4">
            <div className="h-40 rounded-xl border border-[#E5E7EB] bg-white animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="mx-auto max-w-7xl px-4 pb-4 sm:px-6"
      aria-label="Keranjang Belanja"
    >
      <Breadcrumb className="pt-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/" />}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/katalog" />}>
              Shop
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Keranjang Belanja</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-[#1A1A1A] sm:text-2xl">
            Keranjang Belanja
          </h1>
          <p className="mt-0.5 text-xs text-[#6B7280] sm:text-[13px]">
            Atelier Flora Tasikmalaya — Rangkaian segar dirangkai khusus hari
            ini.
          </p>
        </div>
        <DeliverySlotNote />
      </div>

      <GuestBanner />

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 w-full space-y-4">
          <CartSelectBar
            itemCount={lines.length}
            selectedCount={selectedKeys.length}
            allSelected={allSelected}
            someSelected={someSelected}
            onToggleAll={toggleAll}
            onDeleteSelected={handleDeleteSelected}
          />

          {lines.map((line) => (
            <CartLineItem
              key={`${line.kind ?? "product"}:${line.slug}:${line.sizeId}:${line.wrapId}`}
              line={line}
              selected={selectedKeys.includes(
                `${line.kind ?? "product"}:${line.slug}:${line.sizeId}:${line.wrapId}`,
              )}
              onSelectedChange={(checked: boolean) =>
                toggleKey(
                  `${line.kind ?? "product"}:${line.slug}:${line.sizeId}:${line.wrapId}`,
                )
              }
              onQtyChange={(qty: number) =>
                updateQty(
                  `${line.kind ?? "product"}:${line.slug}:${line.sizeId}:${line.wrapId}`,
                  qty,
                )
              }
              onRemove={() =>
                remove(
                  `${line.kind ?? "product"}:${line.slug}:${line.sizeId}:${line.wrapId}`,
                )
              }
              onSaveLater={() =>
                saveForLater(
                  `${line.kind ?? "product"}:${line.slug}:${line.sizeId}:${line.wrapId}`,
                )
              }
            />
          ))}

          <FreeShippingProgress subtotal={totals.subtotal} />

          <CartInstructionsField
            value={instructions}
            onChange={setInstructions}
          />
        </div>

        <div className="lg:sticky lg:top-24 w-full space-y-4">
          <OrderSummary
            totals={totals}
            coupon={coupon}
            onApplyCoupon={applyCoupon}
            onRemoveCoupon={removeCoupon}
            checkoutDisabled={lines.length === 0}
          />
          <SavedForLater
            lines={saved}
            onMoveToCart={moveToCart}
            onRemove={removeSaved}
          />
          <AtelierAddons lines={lines} />
        </div>
      </div>

      <section aria-label="Jaminan belanja" className="mt-6 lg:hidden">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST_ITEMS.map((item) => (
            <li
              key={item.title}
              className="flex items-start gap-2.5 rounded-xl border border-[#E5E7EB] bg-white p-3"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FFF3ED] text-[#FF6B35]">
                <item.icon size={18} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-xs font-bold text-[#1A1A1A]">
                  {item.title}
                </span>
                <span className="block text-[11px] text-[#6B7280]">
                  {item.subtitle}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

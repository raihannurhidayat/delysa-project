import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Plus,
  Check,
  ShieldCheck,
  Truck,
  Camera,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { formatIDR } from "~/features/shop/lib/format";
import { useMiniCart } from "~/features/shop/hooks/use-mini-cart";
import type { MiniCartLine } from "~/features/shop/types";

const CART_ADDONS = [
  {
    id: "ceramic-vase",
    name: "Matte Basalt Ceramic Vase",
    price: 185000,
    image:
      "https://images.unsplash.com/photo-1588454144077-6a5d8c1a8b5d?w=400&h=400&fit=crop",
  },
  {
    id: "keepsake-wax-seal",
    name: "Artisanal Keepsake & Wax Seal",
    price: 35000,
    image:
      "https://images.unsplash.com/photo-1589258927616-2d6d3b3c3b5d?w=400&h=400&fit=crop",
  },
  {
    id: "teddy-unsil",
    name: "Boneka Wisuda Mini Teddy UNSIL",
    price: 45000,
    image:
      "https://images.unsplash.com/photo-1589258927616-2d6d3b3c3b5d?w=400&h=400&fit=crop",
  },
  {
    id: "ferrero-rocher",
    name: "Ferrero Rocher Box (3 Pcs)",
    price: 55000,
    image:
      "https://images.unsplash.com/photo-1548907077-441c76a8b3e3?w=400&h=400&fit=crop",
  },
];

interface AtelierAddonsProps {
  lines: MiniCartLine[];
}

export function AtelierAddons({ lines }: AtelierAddonsProps) {
  const { add } = useMiniCart();
  const navigate = useNavigate({ from: "/keranjang" });

  const existingAddonKeys = new Set(
    lines
      .filter((l) => l.kind === "addon")
      .map((l) => l.slug.replace("addon:", "")),
  );

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-extrabold text-[#1A1A1A]">
            ATELIER ADD-ONS
          </h3>
          <p className="text-[11px] text-[#6B7280]">
            Lengkapi Momen Spesial Anda
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {CART_ADDONS.map((addon) => {
          const isAdded = existingAddonKeys.has(addon.id);
          return (
            <div
              key={addon.id}
              className={`group relative rounded-xl border overflow-hidden transition-all ${
                isAdded
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-[#E5E7EB] bg-white hover:border-[#FF6B35]"
              }`}
            >
              <div className="aspect-square w-full overflow-hidden">
                <img
                  src={addon.image}
                  alt={addon.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-[#1A1A1A] truncate">
                  {addon.name}
                </p>
                <p className="mt-0.5 text-sm font-bold text-[#1A1A1A]">
                  {formatIDR(addon.price)}
                </p>
              </div>
              {isAdded ? (
                <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/10">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-1 text-xs font-bold text-white">
                    <Check size={10} aria-hidden="true" /> Ditambahkan
                  </span>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    add({
                      slug: `addon:${addon.id}`,
                      name: addon.name,
                      image: addon.image,
                      sizeId: "-",
                      sizeLabel: "Add-on",
                      wrapId: "-",
                      price: addon.price,
                      qty: 1,
                      kind: "addon",
                      maxQty: 10,
                    });
                  }}
                  className="absolute bottom-3 left-3 right-3 rounded-full bg-[#111111] text-white hover:bg-[#2A2A2A]"
                >
                  <Plus size={14} aria-hidden="true" className="mr-1" /> Tambah
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

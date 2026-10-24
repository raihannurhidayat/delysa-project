import type { LucideIcon } from "lucide-react";
import { Clock, Headset, ShieldCheck, Truck } from "lucide-react";
import { STOREFRONT_TRUST } from "~/features/shop/data/storefront";

export type TrustItem = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
};

const ICONS = [Clock, Truck, ShieldCheck, Headset];

export const DEFAULT_TRUST_ITEMS: TrustItem[] = STOREFRONT_TRUST.map(
  (item, index) => ({
    ...item,
    icon: ICONS[index % ICONS.length],
  }),
);

export function TrustStrip({
  items = DEFAULT_TRUST_ITEMS,
  ariaLabel = "Keunggulan toko",
}: {
  items?: readonly TrustItem[];
  ariaLabel?: string;
}) {
  return (
    <section
      aria-label={ariaLabel}
      className="mx-auto max-w-7xl px-4 pt-6 sm:px-6"
    >
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.title}
              className="flex items-center gap-2.5 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FFF3ED] text-[#FF6B35]">
                <Icon size={18} aria-hidden="true" />
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
          );
        })}
      </ul>
    </section>
  );
}

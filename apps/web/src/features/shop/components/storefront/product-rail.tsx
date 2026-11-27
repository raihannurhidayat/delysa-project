import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  CardProduct,
  ProductCardSkeleton,
} from "~/features/shop/components/card-product";
import { SectionHeader } from "~/features/shop/components/storefront/section-header";
import type { Product } from "~/features/shop/types";
import { cn } from "~/lib/utils";

type ProductRailLink =
  | {
      to: "/katalog";
      search?: {
        category?: string;
        sort?: "termurah" | "termahal" | "terbaru";
      };
    }
  | { to: "/new-arrivals" | "/best-sellers" | "/categories" | "/promo" };

type ProductRailProps = {
  eyebrow: string;
  title: string;
  linkText?: string;
  link?: ProductRailLink;
  products: Product[];
  tabs?: string[];
  timer?: React.ReactNode;
  initialVisible?: number;
  loadMoreText?: string;
  isPending?: boolean;
};

export function ProductRail({
  eyebrow,
  title,
  linkText,
  link,
  products,
  tabs,
  timer,
  initialVisible = 4,
  loadMoreText,
  isPending = false,
}: ProductRailProps) {
  const [activeTab, setActiveTab] = useState(tabs?.[0] ?? "");
  const [expanded, setExpanded] = useState(false);

  const filtered =
    tabs && activeTab !== tabs[0]
      ? products.filter((p) => p.category === activeTab)
      : products;
  const visible = expanded ? filtered : filtered.slice(0, initialVisible);

  return (
    <section aria-label={title} className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        linkText={linkText}
        link={link}
      />
      {tabs || timer ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {tabs?.map((tab) => (
            <Button
              key={tab}
              type="button"
              variant={tab === activeTab ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setActiveTab(tab);
                setExpanded(false);
              }}
              aria-pressed={tab === activeTab}
              className={cn(
                "rounded-full",
                tab === activeTab
                  ? "bg-[#BE185D] text-white hover:bg-[#9D174D]"
                  : "border-[#EAE2DE] bg-white text-[#57534E] hover:bg-[#FDF2F8] hover:text-[#9D174D]",
              )}
            >
              {tab}
            </Button>
          ))}
          {timer ? (
            <div className="ml-auto flex items-center gap-2">{timer}</div>
          ) : null}
        </div>
      ) : null}
      {isPending ? (
        <div
          className="grid grid-cols-2 gap-3.5 md:grid-cols-4"
          aria-label="Memuat produk"
        >
          {Array.from({ length: initialVisible }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#EAE2DE] bg-white p-8 text-center text-sm text-[#57534E]">
          Belum ada produk pada kategori ini.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
          {visible.map((product) => (
            <CardProduct key={product.id} item={product} variant="default" />
          ))}
        </div>
      )}
      {loadMoreText && !expanded && filtered.length > initialVisible ? (
        <div className="mt-5 text-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setExpanded(true)}
            className="rounded-full border-[#EAE2DE] bg-white px-5 text-[#1C1917] hover:bg-[#FDF2F8] hover:text-[#9D174D]"
          >
            {loadMoreText}
            <ChevronDown size={16} aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </section>
  );
}

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  ProductCard,
  ProductCardSkeleton,
} from "~/features/product/components/product-card";
import { SectionHeader } from "~/features/product/components/section-header";
import type { Product } from "~/features/product/types";
import { cn } from "~/lib/utils";

type ProductRailProps = {
  eyebrow: string;
  title: string;
  linkText?: string;
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
      <SectionHeader eyebrow={eyebrow} title={title} linkText={linkText} />
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
              "rounded-xs",
              tab === activeTab && "bg-[#111111] text-white hover:bg-[#2A2A2A]",
            )}
          >
            {tab}
          </Button>
        ))}
        {timer ? (
          <div className="ml-auto flex items-center gap-2">{timer}</div>
        ) : null}
      </div>
      {isPending ? (
        <div
          className="grid grid-cols-2 gap-3 md:grid-cols-4"
          aria-label="Memuat produk"
        >
          {Array.from({ length: initialVisible }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#E5E7EB] bg-[#F8F9FA] p-8 text-center text-sm text-[#6B7280]">
          Belum ada produk pada kategori ini.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
      {loadMoreText && !expanded && filtered.length > initialVisible ? (
        <div className="mt-4 text-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setExpanded(true)}
            className="rounded-full"
          >
            {loadMoreText}
            <ChevronDown size={16} aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </section>
  );
}

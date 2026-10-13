import type { CatalogSearch } from "~/features/shop/schemas/catalog-query-schema";
import { ShopPlaceholderPage } from "~/features/shop/view/shop-placeholder-page";

export default function CatalogPage({ query }: { query?: CatalogSearch }) {
  void query;
  return (
    <ShopPlaceholderPage
      title="Shop Semua Produk"
      description="Katalog lengkap Delysa Florist segera hadir di halaman ini."
    />
  );
}

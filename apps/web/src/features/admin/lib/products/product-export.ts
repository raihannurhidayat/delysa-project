import { getStockStatus } from "./product-filters";
import { getProductRevenue, type AdminProduct } from "./product.types";

const CSV_HEADERS = [
  "Nama",
  "SKU",
  "Kategori",
  "Harga",
  "Terjual",
  "Pendapatan",
  "Stok",
  "Satuan",
  "Threshold Minimum",
  "Status Stok",
  "Status Publik",
  "Rating",
] as const;

const STOCK_LABEL = {
  aman: "Aman",
  menipis: "Menipis",
  habis: "Habis",
} as const;

function escapeCsvCell(value: string | number): string {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

/** Serialisasi produk terfilter menjadi CSV siap unduh (BOM ditambahkan saat download). */
export function productsToCsv(products: AdminProduct[]): string {
  const rows = products.map((product) =>
    [
      product.name,
      product.sku,
      product.category,
      product.price,
      product.sales,
      getProductRevenue(product),
      product.stock,
      product.stockUnit,
      product.minThreshold,
      STOCK_LABEL[getStockStatus(product)],
      product.isPublished ? "Aktif di Web" : "Draf",
      product.rating,
    ].map(escapeCsvCell),
  );

  return [CSV_HEADERS.join(","), ...rows.map((row) => row.join(","))].join(
    "\r\n",
  );
}

export function downloadProductsCsv(
  products: AdminProduct[],
  filename = "produk-delysa.csv",
): void {
  const blob = new Blob([`\uFEFF${productsToCsv(products)}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

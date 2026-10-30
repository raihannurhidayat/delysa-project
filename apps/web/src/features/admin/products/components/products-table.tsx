import { PencilIcon } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { formatRupiah, getStockStatus } from "../lib/product-filters";
import type { AdminProduct } from "../lib/product.types";

const STOCK_BADGE: Record<
  ReturnType<typeof getStockStatus>,
  { label: string; className: string }
> = {
  aman: { label: "Aman", className: "bg-[#DCFCE7] text-[#166534]" },
  menipis: { label: "Menipis", className: "bg-[#FFEDD5] text-[#C2410C]" },
  habis: { label: "Habis", className: "bg-[#FEE2E2] text-[#B91C1C]" },
};

export function ProductsTable({
  products,
  hasFilters,
  onEdit,
  onReset,
}: {
  products: AdminProduct[];
  hasFilters: boolean;
  onEdit: (product: AdminProduct) => void;
  onReset: () => void;
}) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
        <p className="text-sm font-bold text-[#1A1A1A]">
          {hasFilters
            ? "Tidak ada produk yang cocok dengan filter"
            : "Belum ada produk"}
        </p>
        <p className="max-w-sm text-xs leading-relaxed text-[#6B7280]">
          {hasFilters
            ? "Coba ubah kata kunci atau reset filter untuk melihat seluruh katalog."
            : "Tambahkan produk pertama melalui tombol “Tambah Produk”."}
        </p>
        {hasFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            className="mt-2 h-9 rounded-lg text-xs font-semibold"
          >
            Reset filter
          </Button>
        )}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-4">Produk</TableHead>
          <TableHead>Kategori</TableHead>
          <TableHead>Harga</TableHead>
          <TableHead>Stok Saat Ini</TableHead>
          <TableHead>Threshold Minimum</TableHead>
          <TableHead>Status Publik</TableHead>
          <TableHead className="pr-4 text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => {
          const stock = STOCK_BADGE[getStockStatus(product)];

          return (
            <TableRow key={product.id}>
              <TableCell className="pl-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F3F4F6] text-[#C2410C]">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt=""
                        loading="lazy"
                        className="size-10 object-cover"
                      />
                    ) : (
                      <span aria-hidden="true" className="text-xs font-bold">
                        {product.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block max-w-56 truncate text-sm font-bold text-[#1A1A1A]">
                      {product.name}
                    </span>
                    <span className="block text-[11px] font-medium text-[#6B7280]">
                      SKU: {product.sku}
                    </span>
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-[#374151]">
                {product.category}
              </TableCell>
              <TableCell className="text-sm font-bold text-[#1A1A1A]">
                {formatRupiah(product.price)}
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#1A1A1A]">
                    {product.stock} {product.stockUnit}
                  </span>
                  <Badge className={`border-transparent ${stock.className}`}>
                    {stock.label}
                  </Badge>
                </span>
              </TableCell>
              <TableCell className="text-xs text-[#6B7280]">
                Min: {product.minThreshold} {product.stockUnit}
              </TableCell>
              <TableCell>
                <Badge
                  className={
                    product.isPublished
                      ? "border-transparent bg-[#DCFCE7] text-[#166534]"
                      : "border-transparent bg-[#F3F4F6] text-[#6B7280]"
                  }
                >
                  {product.isPublished ? "Aktif di Web" : "Draf"}
                </Badge>
              </TableCell>
              <TableCell className="pr-4 text-right">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(product)}
                  aria-label={`Edit produk ${product.name}`}
                  className="h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold"
                >
                  <PencilIcon size={13} aria-hidden="true" />
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

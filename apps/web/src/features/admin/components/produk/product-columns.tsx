import { PencilIcon, StarIcon } from "lucide-react";
import {
  createColumnHelper,
  sortFn_alphanumeric,
  sortFn_basic,
} from "@tanstack/react-table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  getStockStatus,
  formatRupiah,
} from "../../lib/products/product-filters";
import {
  getProductRevenue,
  type AdminProduct,
  type ProductStockStatus,
} from "../../lib/products/product.types";
import { productTableFeatures } from "../../lib/products/product-table-config";

const columnHelper = createColumnHelper<
  typeof productTableFeatures,
  AdminProduct
>();

const STOCK_BADGE: Record<
  ProductStockStatus,
  { label: string; className: string }
> = {
  aman: { label: "Tersedia", className: "bg-[#DCFCE7] text-[#166534]" },
  menipis: { label: "Menipis", className: "bg-[#FFEDD5] text-[#C2410C]" },
  habis: { label: "Habis", className: "bg-[#FEE2E2] text-[#B91C1C]" },
};

export function ProductThumbnail({ product }: { product: AdminProduct }) {
  if (product.imageUrl) {
    return (
      <img
        src={product.imageUrl}
        alt=""
        loading="lazy"
        className="size-9 shrink-0 rounded-lg object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF3ED] text-[11px] font-bold text-[#C2410C]"
    >
      {product.name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function StockBadge({ product }: { product: AdminProduct }) {
  const badge = STOCK_BADGE[getStockStatus(product)];

  return (
    <Badge className={`border-transparent ${badge.className}`}>
      {badge.label}
    </Badge>
  );
}

export function createProductColumns({
  onEdit,
}: {
  onEdit: (p: AdminProduct) => void;
}) {
  return columnHelper.columns([
    columnHelper.display({
      id: "select",
      enableSorting: false,
      enableHiding: false,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            table.getIsSomePageRowsSelected() &&
            !table.getIsAllPageRowsSelected()
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(value)}
          aria-label="Pilih semua produk di halaman ini"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(value)}
          aria-label={`Pilih ${row.original.name}`}
        />
      ),
    }),
    columnHelper.accessor("name", {
      id: "name",
      header: "Produk",
      enableHiding: false,
      sortFn: sortFn_alphanumeric,
      cell: ({ row }) => {
        const product = row.original;

        return (
          <div className="flex min-w-0 items-center gap-2.5">
            <ProductThumbnail product={product} />
            <div className="min-w-0">
              <p className="max-w-[10rem] truncate text-xs font-bold text-[#1A1A1A] sm:max-w-[16rem] sm:text-sm">
                {product.name}
              </p>
              <p className="text-[10px] font-medium text-[#6B7280] sm:text-[11px]">
                SKU: {product.sku}
              </p>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("category", {
      header: "Kategori",
      sortFn: sortFn_alphanumeric,
      cell: (info) => (
        <span className="text-xs text-[#374151]">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("price", {
      header: "Harga",
      sortFn: sortFn_basic,
      cell: (info) => (
        <span className="text-xs font-bold text-[#1A1A1A]">
          {formatRupiah(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor("sales", {
      header: "Terjual",
      sortFn: sortFn_basic,
      cell: (info) => (
        <span className="text-xs font-medium text-[#374151]">
          {info.getValue()} pcs
        </span>
      ),
    }),
    columnHelper.accessor((row) => getProductRevenue(row), {
      id: "revenue",
      header: "Pendapatan",
      sortFn: sortFn_basic,
      cell: (info) => (
        <span className="text-xs font-medium text-[#374151]">
          {formatRupiah(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor("stock", {
      header: "Stok",
      sortFn: sortFn_basic,
      cell: ({ row }) => (
        <span className="text-xs font-bold text-[#1A1A1A]">
          {row.original.stock} {row.original.stockUnit}
        </span>
      ),
    }),
    columnHelper.accessor((row) => getStockStatus(row), {
      id: "status",
      header: "Status",
      sortFn: sortFn_alphanumeric,
      cell: ({ row }) => <StockBadge product={row.original} />,
    }),
    columnHelper.accessor("rating", {
      header: "Rating",
      sortFn: sortFn_basic,
      cell: (info) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1A1A1A]">
          <StarIcon
            size={13}
            aria-hidden="true"
            className="fill-[#F59E0B] text-[#F59E0B]"
          />
          {info.getValue().toFixed(1)}
        </span>
      ),
    }),
    columnHelper.accessor("minThreshold", {
      header: "Min. Stok",
      sortFn: sortFn_basic,
      cell: ({ row }) => (
        <span className="text-xs text-[#6B7280]">
          {row.original.minThreshold} {row.original.stockUnit}
        </span>
      ),
    }),
    columnHelper.accessor("isPublished", {
      header: "Publik",
      sortFn: sortFn_basic,
      cell: (info) => (
        <Badge
          className={
            info.getValue()
              ? "border-transparent bg-[#DCFCE7] text-[#166534]"
              : "border-transparent bg-[#F3F4F6] text-[#6B7280]"
          }
        >
          {info.getValue() ? "Aktif di Web" : "Draf"}
        </Badge>
      ),
    }),
    columnHelper.display({
      id: "action",
      header: () => <span className="sr-only">Aksi</span>,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onEdit(row.original)}
          aria-label={`Edit produk ${row.original.name}`}
          className="h-8 gap-1 rounded-lg px-2 text-xs font-semibold text-[#6B7280] hover:bg-[#FFF3ED] hover:text-[#C2410C]"
        >
          <PencilIcon size={13} aria-hidden="true" />
          <span className="hidden sm:inline">Edit</span>
        </Button>
      ),
    }),
  ]);
}

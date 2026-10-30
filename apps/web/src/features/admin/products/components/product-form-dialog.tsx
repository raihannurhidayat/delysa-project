import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { PRODUCT_CATEGORIES, type AdminProduct } from "../lib/product.types";

const productFormSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  sku: z
    .string()
    .min(3, "SKU minimal 3 karakter")
    .max(30)
    .regex(/^[A-Za-z0-9-]+$/, "SKU hanya boleh huruf, angka, dan tanda hubung"),
  category: z.enum(PRODUCT_CATEGORIES, { message: "Kategori wajib dipilih" }),
  price: z.coerce.number().int().min(0, "Harga tidak boleh negatif"),
  stock: z.coerce.number().int().min(0, "Stok tidak boleh negatif"),
  stockUnit: z.string().min(1, "Satuan wajib diisi").max(20),
  minThreshold: z.coerce
    .number()
    .int()
    .min(0, "Threshold tidak boleh negatif"),
  imageUrl: z
    .string()
    .url("URL gambar tidak valid")
    .max(500)
    .optional()
    .or(z.literal("")),
  isPublished: z.boolean(),
});

export type ProductFormValues = z.output<typeof productFormSchema>;

const EMPTY_VALUES: ProductFormValues = {
  name: "",
  sku: "",
  category: "Buket",
  price: 0,
  stock: 0,
  stockUnit: "Buket",
  minThreshold: 0,
  imageUrl: "",
  isPublished: true,
};

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: AdminProduct | null;
  onSubmit: (values: ProductFormValues) => void;
}) {
  const isEdit = Boolean(product);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    if (product) {
      reset({
        name: product.name,
        sku: product.sku,
        category: (PRODUCT_CATEGORIES as readonly string[]).includes(
          product.category,
        )
          ? (product.category as ProductFormValues["category"])
          : "Buket",
        price: product.price,
        stock: product.stock,
        stockUnit: product.stockUnit,
        minThreshold: product.minThreshold,
        imageUrl: product.imageUrl ?? "",
        isPublished: product.isPublished,
      });
    } else {
      reset(EMPTY_VALUES);
    }
  }, [open, product, reset]);

  const category = watch("category");
  const isPublished = watch("isPublished");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Produk" : "Tambah Produk"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui detail produk, termasuk stok dan threshold minimum."
              : "Lengkapi detail produk untuk menambahkannya ke katalog."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit((values) => onSubmit(values))}
          noValidate
        >
          <Field data-invalid={errors.name ? "true" : undefined}>
            <FieldLabel htmlFor="product-name">Nama Produk</FieldLabel>
            <Input
              id="product-name"
              placeholder="cth. Buket Mawar Wisuda"
              aria-invalid={errors.name ? "true" : undefined}
              {...register("name")}
            />
            <FieldError errors={[errors.name]} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={errors.sku ? "true" : undefined}>
              <FieldLabel htmlFor="product-sku">SKU</FieldLabel>
              <Input
                id="product-sku"
                placeholder="cth. DF-BRKT-001"
                aria-invalid={errors.sku ? "true" : undefined}
                {...register("sku")}
              />
              <FieldError errors={[errors.sku]} />
            </Field>

            <Field data-invalid={errors.category ? "true" : undefined}>
              <FieldLabel htmlFor="product-category">Kategori</FieldLabel>
              <Select
                value={category}
                onValueChange={(value) => {
                  if (value) {
                    setValue("category", value as ProductFormValues["category"], {
                      shouldValidate: true,
                    });
                  }
                }}
              >
                <SelectTrigger
                  id="product-category"
                  aria-label="Kategori produk"
                  className="w-full rounded-lg border-[#E5E7EB] bg-white text-sm font-normal normal-case text-[#1A1A1A]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} className="rounded-lg">
                  {PRODUCT_CATEGORIES.map((option) => (
                    <SelectItem
                      key={option}
                      value={option}
                      className="rounded-md text-xs"
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[errors.category]} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={errors.price ? "true" : undefined}>
              <FieldLabel htmlFor="product-price">Harga (Rp)</FieldLabel>
              <Input
                id="product-price"
                type="number"
                min={0}
                step={1000}
                aria-invalid={errors.price ? "true" : undefined}
                {...register("price")}
              />
              <FieldError errors={[errors.price]} />
            </Field>

            <Field data-invalid={errors.stock ? "true" : undefined}>
              <FieldLabel htmlFor="product-stock">Stok</FieldLabel>
              <Input
                id="product-stock"
                type="number"
                min={0}
                aria-invalid={errors.stock ? "true" : undefined}
                {...register("stock")}
              />
              <FieldError errors={[errors.stock]} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={errors.stockUnit ? "true" : undefined}>
              <FieldLabel htmlFor="product-stock-unit">Satuan Stok</FieldLabel>
              <Input
                id="product-stock-unit"
                placeholder="cth. Buket / Tangkai"
                aria-invalid={errors.stockUnit ? "true" : undefined}
                {...register("stockUnit")}
              />
              <FieldError errors={[errors.stockUnit]} />
            </Field>

            <Field data-invalid={errors.minThreshold ? "true" : undefined}>
              <FieldLabel htmlFor="product-min-threshold">
                Threshold Minimum
              </FieldLabel>
              <Input
                id="product-min-threshold"
                type="number"
                min={0}
                aria-invalid={errors.minThreshold ? "true" : undefined}
                {...register("minThreshold")}
              />
              <FieldError errors={[errors.minThreshold]} />
            </Field>
          </div>

          <Field data-invalid={errors.imageUrl ? "true" : undefined}>
            <FieldLabel htmlFor="product-image-url">
              URL Gambar (opsional)
            </FieldLabel>
            <Input
              id="product-image-url"
              type="url"
              placeholder="https://…"
              aria-invalid={errors.imageUrl ? "true" : undefined}
              {...register("imageUrl")}
            />
            <FieldError errors={[errors.imageUrl]} />
          </Field>

          <Field orientation="horizontal">
            <input
              id="product-is-published"
              type="checkbox"
              className="size-4 rounded border-[#D1D5DB]"
              checked={isPublished}
              {...register("isPublished")}
            />
            <FieldLabel htmlFor="product-is-published" className="text-sm font-medium">
              Aktif di web (tayang publik)
            </FieldLabel>
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-lg"
            >
              Batal
            </Button>
            <Button type="submit" className="rounded-lg bg-[#FF6B35] text-white hover:bg-[#C2410C]">
              {isEdit ? "Simpan Perubahan" : "Tambah Produk"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

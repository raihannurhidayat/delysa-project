import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "~/components/ui/textarea";
import {
  MANUAL_ORDER_FORM_SCHEMA,
  type ManualOrderFormValues,
} from "../../lib/pesanan/manual-order";

/**
 * Dialog "Buat Pesanan Manual": form 1 item + alamat kirim, tervalidasi Zod.
 * Pola `product-form-dialog.tsx` (RHF + zodResolver).
 */
export function AdminOrderManualDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange(open: boolean): void;
  onSubmit(values: ManualOrderFormValues): void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ManualOrderFormValues>({
    resolver: zodResolver(MANUAL_ORDER_FORM_SCHEMA),
    defaultValues: {
      itemName: "",
      itemQty: 1,
      itemPrice: 0,
      recipientName: "",
      recipientPhone: "",
      shippingAddress: "",
      customNote: "",
    },
  });

  function handleClose(next: boolean) {
    if (!next) {
      reset();
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[calc(100svh-3rem)] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buat Pesanan Manual</DialogTitle>
          <DialogDescription>
            Catat pesanan cabang/WA: 1 item, pembayaran transfer manual BCA,
            status awal menunggu pembayaran.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit((values) => {
            onSubmit(values);
            reset();
          })}
          noValidate
        >
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
            <Field data-invalid={errors.itemName ? "true" : undefined}>
              <FieldLabel htmlFor="manual-item-name">Nama Produk</FieldLabel>
              <Input
                id="manual-item-name"
                placeholder="cth. Buket Mawar Wisuda"
                aria-invalid={errors.itemName ? "true" : undefined}
                {...register("itemName")}
              />
              <FieldError errors={[errors.itemName]} />
            </Field>

            <div className="grid gap-3 md:grid-cols-2">
              <Field data-invalid={errors.itemQty ? "true" : undefined}>
                <FieldLabel htmlFor="manual-item-qty">Jumlah</FieldLabel>
                <Input
                  id="manual-item-qty"
                  type="number"
                  min={1}
                  aria-invalid={errors.itemQty ? "true" : undefined}
                  {...register("itemQty")}
                />
                <FieldError errors={[errors.itemQty]} />
              </Field>

              <Field data-invalid={errors.itemPrice ? "true" : undefined}>
                <FieldLabel htmlFor="manual-item-price">Harga (Rp)</FieldLabel>
                <Input
                  id="manual-item-price"
                  type="number"
                  min={0}
                  step={1000}
                  aria-invalid={errors.itemPrice ? "true" : undefined}
                  {...register("itemPrice")}
                />
                <FieldError errors={[errors.itemPrice]} />
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field data-invalid={errors.recipientName ? "true" : undefined}>
                <FieldLabel htmlFor="manual-recipient-name">
                  Nama Penerima
                </FieldLabel>
                <Input
                  id="manual-recipient-name"
                  placeholder="cth. Amelia Lestari"
                  aria-invalid={errors.recipientName ? "true" : undefined}
                  {...register("recipientName")}
                />
                <FieldError errors={[errors.recipientName]} />
              </Field>

              <Field data-invalid={errors.recipientPhone ? "true" : undefined}>
                <FieldLabel htmlFor="manual-recipient-phone">
                  Nomor WhatsApp
                </FieldLabel>
                <Input
                  id="manual-recipient-phone"
                  type="tel"
                  placeholder="cth. 0812-3456-7890"
                  aria-invalid={errors.recipientPhone ? "true" : undefined}
                  {...register("recipientPhone")}
                />
                <FieldError errors={[errors.recipientPhone]} />
              </Field>
            </div>

            <Field data-invalid={errors.shippingAddress ? "true" : undefined}>
              <FieldLabel htmlFor="manual-shipping-address">
                Alamat Pengiriman
              </FieldLabel>
              <Textarea
                id="manual-shipping-address"
                rows={2}
                placeholder="Jalan, nomor rumah, kota…"
                aria-invalid={errors.shippingAddress ? "true" : undefined}
                {...register("shippingAddress")}
              />
              <FieldError errors={[errors.shippingAddress]} />
            </Field>

            <Field data-invalid={errors.customNote ? "true" : undefined}>
              <FieldLabel htmlFor="manual-custom-note">
                Catatan (opsional)
              </FieldLabel>
              <Textarea
                id="manual-custom-note"
                rows={2}
                placeholder="cth. tulis nama wisudawan di pita…"
                {...register("customNote")}
              />
              <FieldError errors={[errors.customNote]} />
            </Field>
          </div>

          <DialogFooter className="mt-4 flex shrink-0 flex-row gap-2 border-t border-[#F1F2F4] pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              className="flex-1 rounded-lg"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-lg bg-[#FF6B35] text-white hover:bg-[#C2410C]"
            >
              Simpan Pesanan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

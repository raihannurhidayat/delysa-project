import { useState } from "react";
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
import { Textarea } from "~/components/ui/textarea";
import type { AdminOrderView } from "../../lib/pesanan/admin-order.types";

const rejectReasonSchema = z
  .string()
  .trim()
  .min(5, "Alasan minimal 5 karakter")
  .max(200, "Alasan maksimal 200 karakter");

export function AdminOrderRejectDialog({
  order,
  open,
  onOpenChange,
  onSubmit,
}: {
  order: AdminOrderView | null;
  open: boolean;
  onOpenChange(open: boolean): void;
  onSubmit(code: string, reason: string): void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    const parsed = rejectReasonSchema.safeParse(reason);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Alasan tidak valid");
      return;
    }

    if (!order) return;
    onSubmit(order.code, parsed.data);
    onOpenChange(false);
    setReason("");
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setReason("");
      setError(null);
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tolak Pesanan</DialogTitle>
          <DialogDescription>
            {order
              ? `Tulis alasan penolakan untuk pesanan ${order.code} — pelanggan menerima salinan alasan ini.`
              : "Pilih satu pesanan yang akan ditolak."}
          </DialogDescription>
        </DialogHeader>

        <Textarea
          aria-label="Alasan penolakan"
          placeholder="Contoh: Bukti transfer tidak sesuai jumlah tagihan…"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
        />
        {error ? (
          <p role="alert" className="text-xs font-semibold text-[#B91C1C]">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="rounded-lg text-xs font-semibold"
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            className="rounded-lg text-xs font-semibold"
          >
            Tolak Pesanan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

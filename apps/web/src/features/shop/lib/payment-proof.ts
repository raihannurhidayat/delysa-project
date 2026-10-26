import { paymentProofSchema } from "@delysa/shared";

export const PAYMENT_PROOF_ACCEPT = "image/jpeg,image/png,image/webp";
export const PAYMENT_PROOF_MAX_SIZE = 5 * 1024 * 1024;

export function getPaymentProofError(
  orderId: number,
  file: File,
): string | null {
  if (file.size === 0) {
    return "File bukti pembayaran tidak boleh kosong.";
  }

  const parsed = paymentProofSchema.safeParse({
    orderId,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  });

  if (parsed.success) return null;

  const field = parsed.error.issues[0]?.path[0];
  if (field === "fileSize") {
    return "Ukuran file maksimal 5MB.";
  }
  if (field === "fileType") {
    return "Gunakan file JPG, PNG, atau WEBP.";
  }
  if (field === "fileName") {
    return "Nama file terlalu panjang. Gunakan nama file yang lebih pendek.";
  }
  return "File bukti pembayaran tidak valid.";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

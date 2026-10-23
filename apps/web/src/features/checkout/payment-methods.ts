import { isPaymentMethod, type PaymentMethod } from "./types";

export const WHATSAPP_NUMBER = "6282116789558";
export const WHATSAPP_DISPLAY = "082116789558";
export const BCA_ACCOUNT_NUMBER = "054-082-9912";

type PaymentMethodDetails = {
  id: PaymentMethod;
  label: string;
  description: string;
  steps: readonly string[];
  bank?: {
    name: string;
    accountNumber: string;
    accountName: string;
  };
  ctaLabel?: string;
  whatsappMessage?: (totalLabel: string) => string;
};

export const PAYMENT_METHODS: readonly PaymentMethodDetails[] = [
  {
    id: "manual_transfer_bca",
    label: "Transfer Manual BCA",
    description:
      "Transfer ke rekening BCA, lalu unggah bukti pembayaran atau konfirmasi via WhatsApp.",
    bank: {
      name: "BCA",
      accountNumber: BCA_ACCOUNT_NUMBER,
      accountName: "Kartinah",
    },
    steps: [
      "Transfer tepat sebesar total pesanan ke rekening BCA di bawah.",
      "Simpan bukti transfer dari aplikasi bank atau ATM.",
      "Unggah bukti transfer di halaman ini, atau kirim ke WhatsApp admin.",
    ],
  },
  {
    id: "qris",
    label: "QRIS",
    description: "Bayar dengan QRIS melalui aplikasi bank atau e-wallet.",
    steps: [
      "Minta QR code QRIS kepada admin melalui WhatsApp.",
      "Scan QR code dan bayar sesuai total pesanan.",
      "Unggah bukti pembayaran di halaman ini, atau kirim ke WhatsApp admin.",
    ],
    ctaLabel: "Minta QRIS via WhatsApp",
    whatsappMessage: (totalLabel) =>
      `Halo Delysa Florist, saya memilih pembayaran QRIS untuk pesanan sebesar ${totalLabel}. Mohon kirimkan QR code QRIS.`,
  },
];

export const PAYMENT_METHOD_ITEMS = PAYMENT_METHODS.map(({ id, label }) => ({
  value: id,
  label,
}));

export function getPaymentMethod(
  value: PaymentMethod | "" | null | undefined,
): PaymentMethodDetails | null {
  if (!value || !isPaymentMethod(value)) return null;
  return PAYMENT_METHODS.find((method) => method.id === value) ?? null;
}

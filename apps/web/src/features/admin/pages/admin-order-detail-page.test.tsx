import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminOrderDetailPage } from "./admin-order-detail-page";
import type { OrderRecord } from "~/features/shop/types";

const mocks = vi.hoisted(() => ({
  useOrder: vi.fn(),
  useParams: vi.fn(() => ({ orderId: "DLF-20241026-8842" })),
}));

vi.mock("~/features/shop/hooks/use-orders", () => ({
  useOrder: (code: string) => mocks.useOrder(code),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a data-link-to={to}>{children}</a>
  ),
  useParams: () => ({ orderId: "DLF-20241026-8842" }),
}));

function buildRecord(): OrderRecord {
  return {
    id: 7,
    code: "DLF-20241026-8842",
    status: "pending_verification",
    createdAt: "2024-10-26T09:15:00Z",
    updatedAt: "2024-10-26T09:15:00Z",
    paymentDeadline: "2024-10-26T18:00:00Z",
    recipientName: "dr. Amelia Lestari",
    recipientPhone: "0812-3456-7890",
    shippingAddress:
      "Gedung Rektorat UNSIL Lantai 2, Kampus Mugsari, Kota Tasikmalaya, Jawa Barat",
    items: [
      {
        slug: "monolith-peach",
        name: "The Grand Monolith Pea",
        image: "",
        sizeId: "",
        sizeLabel: "1x Bouquet Wisuda",
        wrapId: "",
        price: 500000,
        qty: 1,
      },
      {
        slug: "single-sunflower",
        name: "Single Sunflower Mentari",
        image: "",
        sizeId: "",
        sizeLabel: "2x Stem @ Rp 120.000",
        wrapId: "",
        price: 240000,
        qty: 1,
      },
    ],
    totals: {
      itemCount: 2,
      subtotalNormal: 740000,
      productDiscount: 0,
      subtotal: 740000,
      shipping: 0,
      packaging: 0,
      couponDiscount: 0,
      grandTotal: 740000,
      freeShipping: false,
      remainingForFree: 0,
    },
    payment: {
      methodId: "manual_transfer_bca",
      label: "Transfer Manual BCA",
      description: "",
      bank: {
        name: "BCA",
        accountNumber: "054-082-9912",
        accountName: "Kartinah",
      },
      steps: [],
    },
    timeline: [
      {
        status: "pending_payment",
        at: "2024-10-26T09:15:00Z",
        note: "Pesanan dibuat",
      },
      {
        status: "pending_verification",
        at: "2024-10-26T09:22:00Z",
        note: "Verifikasi",
      },
    ],
  };
}

describe("AdminOrderDetailPage", () => {
  it("renders all sections for a found order", () => {
    mocks.useOrder.mockReturnValue(buildRecord());

    render(<AdminOrderDetailPage />);

    expect(screen.getByText("DLF-20241026-8842")).toBeInTheDocument();
    expect(screen.getByText("dr. Amelia Lestari")).toBeInTheDocument();
    expect(screen.getByText("Informasi Pemesan")).toBeInTheDocument();
    expect(screen.getByText("Lokasi & Jadwal Antar")).toBeInTheDocument();
    expect(screen.getByText("Instruksi Pengantaran")).toBeInTheDocument();
    expect(screen.getByText("Inspeksi Bukti Transfer")).toBeInTheDocument();
    expect(
      screen.getAllByText("Status Pemenuhan Atelier").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Item Komposisi Floral")).toBeInTheDocument();
    expect(screen.getByText("Total Tagihan Final")).toBeInTheDocument();
    expect(screen.getByText("Jejak Audit & Log Transaksi")).toBeInTheDocument();
    expect(screen.getAllByText(/Rp 740.000/).length).toBeGreaterThan(0);
  });

  it("renders Konfirmasi Penolakan Pembayaran when status is rejected", () => {
    const rejected = { ...buildRecord(), status: "rejected" as const };
    mocks.useOrder.mockReturnValue(rejected);

    render(<AdminOrderDetailPage />);

    expect(
      screen.getByText("Konfirmasi Penolakan Pembayaran"),
    ).toBeInTheDocument();
    expect(screen.getByText("TINDAKAN SENSITIF")).toBeInTheDocument();
  });

  it("renders Kartu Ucapan Custom when customNote exists", () => {
    const withNote = {
      ...buildRecord(),
      customNote: "Selamat atas kelulusan dan gelar Doktornya.",
    };
    mocks.useOrder.mockReturnValue(withNote);

    render(<AdminOrderDetailPage />);

    expect(screen.getByText("Kartu Ucapan Custom")).toBeInTheDocument();
    expect(
      screen.getAllByText(/Selamat atas kelulusan/).length,
    ).toBeGreaterThan(0);
  });

  it("shows order not found when order is undefined", () => {
    mocks.useOrder.mockReturnValue(undefined);

    render(<AdminOrderDetailPage />);

    expect(screen.getByText("Order tidak ditemukan")).toBeInTheDocument();
    expect(screen.getByText("Kembali ke daftar pesanan")).toBeInTheDocument();
  });
});

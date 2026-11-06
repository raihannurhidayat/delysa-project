import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { AdminOrdersPage } from "./admin-orders-page";
import { enrichAdminOrder } from "../lib/pesanan/admin-order-enrichment";
import type { OrderRecord } from "~/features/shop/types";
import type { AdminOrderView } from "../lib/pesanan/admin-order.types";

const useAdminOrders = vi.hoisted(() => vi.fn());
const updateOrderStatus = vi.hoisted(() => vi.fn());
const saveOrder = vi.hoisted(() => vi.fn());

vi.mock("../hooks/use-admin-orders", () => ({
  useAdminOrders,
}));

vi.mock("~/features/shop/lib/order-store", () => ({
  updateOrderStatus,
  saveOrder,
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
    ...rest
  }: {
    children: ReactNode;
    to: string;
    params?: { orderId?: string };
  } & Record<string, unknown>) => (
    <a
      {...rest}
      data-link-to={to}
      href={params?.orderId ? `/admin/pesanan/${params.orderId}` : undefined}
    >
      {children}
    </a>
  ),
}));

function rawRecord(index: number): OrderRecord {
  const createdAt = new Date(
    new Date().getTime() - (index + 1) * 18 * 60_000,
  ).toISOString();

  return {
    id: index + 1,
    code: `DLF-20261102-00${index + 10}`,
    status: "pending_verification",
    createdAt,
    updatedAt: createdAt,
    paymentDeadline: createdAt,
    recipientName: `Pelanggan ${index + 1}`,
    recipientPhone: "0812-3456-7890",
    shippingAddress: "Jl. HZ Mustofa No. 10, Tasikmalaya",
    items: [
      {
        slug: "monolith-peach",
        name: "Monolith Peach",
        image: "",
        sizeId: "",
        sizeLabel: "",
        wrapId: "",
        price: 370000,
        qty: 1,
      },
    ],
    totals: {
      itemCount: 1,
      subtotalNormal: 370000,
      productDiscount: 0,
      subtotal: 370000,
      shipping: 0,
      packaging: 0,
      couponDiscount: 0,
      grandTotal: 370000,
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
    timeline: [{ status: "pending_verification", at: createdAt }],
  } as unknown as OrderRecord;
}

function buildOrders(count: number): AdminOrderView[] {
  return Array.from({ length: count }, (_, index) =>
    enrichAdminOrder(rawRecord(index)),
  ) as AdminOrderView[];
}

beforeEach(() => {
  useAdminOrders.mockReturnValue({ orders: buildOrders(9), mounted: true });
  updateOrderStatus.mockClear();
  saveOrder.mockClear();
});

describe("AdminOrdersPage", () => {
  it("renders header, queue cards, tabs, and the first table page", () => {
    render(<AdminOrdersPage />);

    expect(
      screen.getByRole("heading", {
        name: "Manajemen Pesanan & Antrian Fulfillment",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Menunggu Verifikasi Resi")).toBeInTheDocument();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(8);
    expect(
      tabs.some((tab) => tab.textContent?.includes("Menunggu Verifikasi")),
    ).toBe(true);
    expect(screen.getAllByText(/DLF-20261102-/).length).toBeGreaterThan(0);
    expect(screen.getByText("Menampilkan 9 pesanan")).toBeInTheDocument();
  });

  it("filters rows by search and shows the matching count", () => {
    render(<AdminOrdersPage />);

    fireEvent.change(
      screen.getByPlaceholderText(
        "Cari no. order, produk, atau nama pelanggan…",
      ),
      { target: { value: "Pelanggan 2" } },
    );

    expect(screen.getByText("Menampilkan 1 pesanan")).toBeInTheDocument();
  });

  it("switches tabs and keeps counts", () => {
    render(<AdminOrdersPage />);

    fireEvent.click(screen.getByRole("tab", { name: /Sudah Dibayar/ }));

    expect(screen.getByText("Menampilkan 0 pesanan")).toBeInTheDocument();
  });

  it("activates the matching tab when a queue card is clicked", () => {
    render(<AdminOrdersPage />);

    fireEvent.click(screen.getByText("Sedang Dirangkai Hari Ini"));

    expect(
      screen.getByRole("tab", { name: /Sedang Dirangkai/ }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("verifies an order via the row action", () => {
    render(<AdminOrdersPage />);

    fireEvent.click(screen.getAllByRole("button", { name: "Verifikasi" })[0]!);

    expect(updateOrderStatus).toHaveBeenCalledWith(
      expect.stringMatching(/^DLF-20261102-/),
      "paid",
      { note: "Verifikasi" },
    );
  });

  it("opens the reject dialog and submits a reason", async () => {
    render(<AdminOrdersPage />);

    fireEvent.click(screen.getAllByRole("button", { name: "Tolak" })[0]!);
    fireEvent.change(screen.getByLabelText("Alasan penolakan"), {
      target: { value: "Bukti transfer tidak sesuai jumlah" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tolak Pesanan" }));

    await waitFor(() => {
      expect(updateOrderStatus).toHaveBeenCalledWith(
        expect.stringMatching(/^DLF-20261102-/),
        "rejected",
        { note: expect.stringContaining("Bukti transfer") },
      );
    });
  });

  it("opens the manual order dialog and saves a new order", async () => {
    render(<AdminOrdersPage />);

    fireEvent.click(
      screen.getByRole("button", { name: "Buat Pesanan Manual" }),
    );

    fireEvent.change(screen.getByLabelText("Nama Produk"), {
      target: { value: "Buket Mawar Wisuda" },
    });
    fireEvent.change(screen.getByLabelText("Jumlah"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Harga (Rp)"), {
      target: { value: "370000" },
    });
    fireEvent.change(screen.getByLabelText("Nama Penerima"), {
      target: { value: "Amelia Lestari" },
    });
    fireEvent.change(screen.getByLabelText("Nomor WhatsApp"), {
      target: { value: "0812-3456-7890" },
    });
    fireEvent.change(screen.getByLabelText("Alamat Pengiriman"), {
      target: { value: "Jl. HZ Mustofa No. 10, Tasikmalaya" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan Pesanan" }));

    await waitFor(() => {
      expect(saveOrder).toHaveBeenCalledTimes(1);
    });
    const record = saveOrder.mock.calls[0]?.[0];
    expect(record).toMatchObject({
      status: "pending_payment",
      recipientName: "Amelia Lestari",
    });
    expect(String(record?.code)).toMatch(/^DLF-\d{8}-[A-Z0-9]{4}$/);
  });

  it("renders the mock footnote", () => {
    render(<AdminOrdersPage />);

    expect(screen.getByText(/label contoh/i)).toBeInTheDocument();
  });
});

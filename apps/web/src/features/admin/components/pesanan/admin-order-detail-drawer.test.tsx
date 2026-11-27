import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminOrderDetailDrawer } from "./admin-order-detail-drawer";
import { enrichAdminOrder } from "../../lib/pesanan/admin-order-enrichment";
import type { OrderRecord } from "~/features/shop/types";
import type { AdminOrderView } from "../../lib/pesanan/admin-order.types";

const mocks = vi.hoisted(() => ({}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
    ...rest
  }: {
    children: React.ReactNode;
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

function buildRecord(): OrderRecord {
  const createdAt = new Date(new Date().getTime() - 20 * 60_000).toISOString();

  return {
    id: 7,
    code: "DLF-20261102-7777",
    status: "processing",
    createdAt,
    updatedAt: createdAt,
    paymentDeadline: createdAt,
    recipientName: "Amelia Lestari",
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
    timeline: [
      {
        status: "pending_payment",
        at: createdAt,
        note: "Pesanan dibuat oleh admin",
      },
      { status: "pending_verification", at: createdAt, note: "Verifikasi" },
      { status: "paid", at: createdAt },
      { status: "processing", at: createdAt },
    ],
  };
}

function view(overrides: Partial<OrderRecord> = {}): AdminOrderView {
  return {
    ...enrichAdminOrder({ ...buildRecord(), ...overrides }),
  } as AdminOrderView;
}

describe("AdminOrderDetailDrawer", () => {
  it("renders code, status, items, payment, and timeline for a fixture order", () => {
    render(
      <AdminOrderDetailDrawer
        order={view()}
        open={true}
        onOpenChange={() => {}}
      />,
    );

    expect(screen.getAllByText("DLF-20261102-7777")[0]).toBeInTheDocument();
    expect(screen.getByText("Amelia Lestari")).toBeInTheDocument();
    expect(screen.getByText(/Jl\. HZ Mustofa No\. 10/)).toBeInTheDocument();
    expect(screen.getByText("Monolith Peach")).toBeInTheDocument();
    expect(screen.getByText(/054-082-9912/)).toBeInTheDocument();
  });

  it("shows the processing workbench chip", () => {
    render(
      <AdminOrderDetailDrawer
        order={view()}
        open={true}
        onOpenChange={() => {}}
      />,
    );

    expect(screen.getByText(/^Meja Florist [1-3]$/)).toBeInTheDocument();
  });

  it("renders a link to open the full order detail page from the drawer header", () => {
    render(
      <AdminOrderDetailDrawer
        order={view()}
        open={true}
        onOpenChange={() => {}}
      />,
    );

    const link = screen.getByRole("link", { name: "Buka halaman detail" });
    expect(link).toHaveAttribute("href", "/admin/pesanan/DLF-20261102-7777");
  });

  it("renders without any selected order without crashing", () => {
    render(
      <AdminOrderDetailDrawer
        order={null}
        open={true}
        onOpenChange={() => {}}
      />,
    );

    expect(screen.getByText("Tidak ada pesanan dipilih")).toBeInTheDocument();
  });
});

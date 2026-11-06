import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useTable } from "@tanstack/react-table";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { AdminOrderTable } from "./admin-order-table";
import { AdminOrderRejectDialog } from "./admin-order-reject-dialog";
import { createAdminOrderColumns } from "./admin-order-columns";
import { adminOrderTableFeatures } from "../../lib/pesanan/admin-order-table-config";
import { enrichAdminOrder } from "../../lib/pesanan/admin-order-enrichment";
import type { AdminOrderActionId } from "../../lib/pesanan/admin-order-transition";
import type { AdminOrderView } from "../../lib/pesanan/admin-order.types";

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

function buildView(index: number): AdminOrderView {
  const createdAt = new Date(
    new Date().getTime() - (index + 1) * 18 * 60_000,
  ).toISOString();

  return {
    ...enrichAdminOrder({
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
    }),
  } as AdminOrderView;
}

function TableHarness({
  orders,
  hasFilters,
  onReset,
  onView,
  onReject,
}: {
  orders: AdminOrderView[];
  hasFilters: boolean;
  onReset: () => void;
  onView: (order: AdminOrderView) => void;
  onReject: (order: AdminOrderView) => void;
}) {
  function Rows() {
    const columns = createAdminOrderColumns({
      onView,
      onAction: () => {},
      onReject,
    });
    const table = useTable({
      features: adminOrderTableFeatures,
      columns,
      data: orders,
      initialState: { pagination: { pageIndex: 0, pageSize: 8 } },
    });

    return (
      <AdminOrderTable
        table={table}
        hasFilters={hasFilters}
        onReset={onReset}
        onView={onView}
        onReject={onReject}
      />
    );
  }

  return (<Rows />) as unknown as ReactNode;
}

describe("AdminOrderTable", () => {
  it("renders paginated rows (page size 8)", () => {
    const orders = Array.from({ length: 10 }, (_, index) => buildView(index));

    render(
      <TableHarness
        orders={orders}
        hasFilters={false}
        onReset={() => {}}
        onView={() => {}}
        onReject={() => {}}
      />,
    );

    const codes = orders.slice(0, 8).map((order) => order.code);
    for (const code of codes) {
      expect(screen.getAllByText(code).length).toBeGreaterThan(0);
    }
    expect(screen.queryAllByText(orders[8]?.code ?? "").length).toBe(0);
  });

  it("shows the no-results empty state with reset button", () => {
    render(
      <TableHarness
        orders={[]}
        hasFilters={true}
        onReset={vi.fn()}
        onView={() => {}}
        onReject={() => {}}
      />,
    );

    expect(screen.getByText("Tidak ada hasil yang cocok")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reset filter" }),
    ).toBeInTheDocument();
  });

  it("shows the empty-store empty state without reset button", () => {
    render(
      <TableHarness
        orders={[]}
        hasFilters={false}
        onReset={vi.fn()}
        onView={() => {}}
        onReject={() => {}}
      />,
    );

    expect(screen.getByText("Belum ada pesanan")).toBeInTheDocument();
    expect(screen.queryByText("Reset filter")).not.toBeInTheDocument();
  });

  it("clicking a table row calls onView with the order", () => {
    const onView = vi.fn();
    const orders = [buildView(0)];
    render(
      <TableHarness
        orders={orders}
        hasFilters={false}
        onReset={() => {}}
        onView={onView}
        onReject={() => {}}
      />,
    );

    fireEvent.click(screen.getByText(orders[0].code));
    expect(onView).toHaveBeenCalledWith(
      expect.objectContaining({ code: orders[0].code }),
    );
  });
});

describe("AdminOrderRejectDialog", () => {
  const order = buildView(0);

  function renderDialog(
    onSubmit: (code: string, reason: string) => void,
    onOpenChange = vi.fn(),
  ) {
    render(
      <AdminOrderRejectDialog
        order={order}
        open={true}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );
    return onOpenChange;
  }

  it("submits the order code and trimmed reason", () => {
    const onSubmit = vi.fn<(code: string, reason: string) => void>();
    const onOpenChange = renderDialog(onSubmit);

    fireEvent.change(screen.getByLabelText("Alasan penolakan"), {
      target: { value: "  Bukti transfer tidak sesuai jumlah  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tolak Pesanan" }));

    expect(onSubmit).toHaveBeenCalledWith(
      order.code,
      "Bukti transfer tidak sesuai jumlah",
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("rejects a reason shorter than 5 characters", async () => {
    const onSubmit = vi.fn<(code: string, reason: string) => void>();
    renderDialog(onSubmit);

    fireEvent.change(screen.getByLabelText("Alasan penolakan"), {
      target: { value: "oke" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tolak Pesanan" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Alasan minimal 5 karakter",
    );
  });

  it("renders without a selected order without crashing", () => {
    render(
      <AdminOrderRejectDialog
        order={null}
        open={true}
        onOpenChange={() => {}}
        onSubmit={() => {}}
      />,
    );

    expect(screen.getAllByText("Tolak Pesanan").length).toBeGreaterThan(0);
  });
});

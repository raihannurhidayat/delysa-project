import { fireEvent, render, screen } from "@testing-library/react";
import { useTable } from "@tanstack/react-table";
import { describe, expect, it, vi } from "vitest";
import { Link } from "@tanstack/react-router";
import type { OrderRecord } from "~/features/shop/types";
import { createAdminOrderColumns } from "./admin-order-columns";
import { adminOrderTableFeatures } from "../../lib/pesanan/admin-order-table-config";
import {
  enrichAdminOrder,
  hashOrderCode,
} from "../../lib/pesanan/admin-order-enrichment";
import type { AdminOrderActionId } from "../../lib/pesanan/admin-order-transition";
import type { AdminOrderView } from "../../lib/pesanan/admin-order.types";

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

const NOW = new Date();
const PAST = new Date(NOW.getTime() - 18 * 60_000).toISOString();

function baseRecord(code: string) {
  return {
    id: 1,
    code,
    status: "pending_verification" as const,
    createdAt: PAST,
    updatedAt: PAST,
    paymentDeadline: NOW.toISOString(),
    recipientName: "Amelia Lestari",
    recipientPhone: "0812-3456-7890",
    shippingAddress: "Jl. HZ Mustofa No. 10 Tasikmalaya Jawa Barat",
    items: [
      {
        slug: "monolith-peach",
        name: "Monolith Peach",
        image: "",
        sizeId: "",
        sizeLabel: "",
        wrapId: "",
        price: 370000,
        qty: 2,
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
      methodId: "manual_transfer_bca" as const,
      label: "Transfer Manual BCA",
      description: "",
      bank: {
        name: "BCA",
        accountNumber: "054-082-9912",
        accountName: "Kartinah",
      },
      steps: [],
    },
    timeline: [{ status: "pending_verification" as const, at: PAST }],
  } satisfies Omit<OrderRecord, "id" | "code"> & { id?: number; code: string };
}

/** Kode memunculkan batch: tambahkan suffix sampai hash habis dibagi 3. */
function unsilCode(prefix: string): string {
  let code = prefix;
  while (hashOrderCode(code) % 3 !== 0) {
    code += "A";
  }
  return code;
}

/** Kode tanpa batch: tambahkan suffix sampai hash tidak habis dibagi 3. */
function nonBatchCode(prefix: string): string {
  let code = prefix;
  while (hashOrderCode(code) % 3 === 0) {
    code += "A";
  }
  return code;
}

function view(code: string, overrides: Partial<OrderRecord> = {}) {
  return {
    ...enrichAdminOrder(
      { ...baseRecord(code), id: 1, ...overrides } as OrderRecord,
      NOW,
    ),
  } as AdminOrderView;
}

function TestHarness({
  orders,
  onView,
  onAction,
  onReject,
}: {
  orders: AdminOrderView[];
  onView: (order: AdminOrderView) => void;
  onAction: (order: AdminOrderView, actionId: AdminOrderActionId) => void;
  onReject: (order: AdminOrderView) => void;
}) {
  function Rows() {
    const columns = createAdminOrderColumns({ onView, onAction, onReject });
    const table = useTable({
      features: adminOrderTableFeatures,
      columns,
      data: orders,
    });

    return (
      <table>
        <tbody>
          {table.getCoreRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getAllCells().map((cell) => (
                <td key={cell.id}>
                  <table.FlexRender cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return <Rows />;
}

function renderColumns(orders: AdminOrderView[]) {
  const callbacks = {
    onView: vi.fn(),
    onAction: vi.fn(),
    onReject: vi.fn(),
  };

  render(<TestHarness orders={orders} {...callbacks} />);

  return callbacks;
}

describe("createAdminOrderColumns", () => {
  it("renders the six columns for a fixture order", () => {
    renderColumns([view(nonBatchCode("DLF-20261102-0001"))]);

    expect(screen.getByText("DLF-20261102-0001")).toBeInTheDocument();
    expect(screen.getByText(/Monolith Peach/)).toBeInTheDocument();
    expect(screen.getByText("BCA")).toBeInTheDocument();
    expect(screen.getByText(/Transfer Manual/)).toBeInTheDocument();
    expect(screen.getByText("18 menit lalu")).toBeInTheDocument();
    expect(screen.getByText("SLA Normal")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Verifikasi" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tolak" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lihat" })).toBeInTheDocument();
  });

  it("shows the Wisuda UNSIL chip only for batch codes", () => {
    const unsil = view(unsilCode("DLF-20261102-0001"));

    expect(unsil.batch).toBe("unsil");
    const { rerender } = render(
      <TestHarness
        orders={[unsil]}
        onView={vi.fn()}
        onAction={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    expect(screen.getAllByText("Wisuda UNSIL")).toHaveLength(1);
  });

  it("hides the Wisuda UNSIL chip for non-batch codes", () => {
    const regular = view(nonBatchCode("DLF-20261102-0001"));

    expect(regular.batch).toBeUndefined();
    render(
      <TestHarness
        orders={[regular]}
        onView={vi.fn()}
        onAction={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    expect(screen.queryByText("Wisuda UNSIL")).not.toBeInTheDocument();
  });

  it("marks a breached SLA as Prioritas", () => {
    const breached = view("DLF-20261102-0001", {
      createdAt: new Date(NOW.getTime() - 3 * 3_600_000).toISOString(),
    });

    expect(breached.slaBreached).toBe(true);
    render(
      <TestHarness
        orders={[breached]}
        onView={vi.fn()}
        onAction={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    expect(screen.getByText("Prioritas")).toBeInTheDocument();
  });

  it("clicking Verifikasi calls onAction with the order", () => {
    const { onAction } = renderColumns([view("DLF-20261102-0001")]);

    fireEvent.click(screen.getByRole("button", { name: "Verifikasi" }));
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ code: "DLF-20261102-0001" }),
      "verify",
    );
  });

  it("clicking Tolak calls onReject with the order", () => {
    const { onReject } = renderColumns([view("DLF-20261102-0001")]);

    fireEvent.click(screen.getByRole("button", { name: "Tolak" }));
    expect(onReject).toHaveBeenCalledWith(
      expect.objectContaining({ code: "DLF-20261102-0001" }),
    );
  });

  it("clicking Lihat calls onView with the order", () => {
    const { onView } = renderColumns([view("DLF-20261102-0001")]);

    fireEvent.click(screen.getByRole("button", { name: "Lihat" }));
    expect(onView).toHaveBeenCalledWith(
      expect.objectContaining({ code: "DLF-20261102-0001" }),
    );
  });

  it("renders a detail link icon per row that navigates to the order detail route", () => {
    renderColumns([view("DLF-20261102-0001")]);

    expect(
      screen.getByRole("link", {
        name: "Lihat detail penuh DLF-20261102-0001",
      }),
    ).toHaveAttribute("href", "/admin/pesanan/DLF-20261102-0001");
  });

  it("shows forward actions for processing orders, no reject", () => {
    renderColumns([view("DLF-20261102-0002", { status: "processing" })]);

    expect(
      screen.getByRole("button", { name: "Tandai Dikirim" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Verifikasi" }),
    ).not.toBeInTheDocument();
  });
});

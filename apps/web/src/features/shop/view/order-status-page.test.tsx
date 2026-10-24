import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { createDemoOrders } from "~/features/shop/data/orders";
import { maskOrderName } from "~/features/shop/lib/order-privacy";
import { OrderStatusPage } from "./order-status-page";

const NOW = new Date("2026-10-24T12:00:00.000Z");
const ORDERS = createDemoOrders(NOW);

const navigate = vi.fn();
const add = vi.fn();
const updateOrderStatus = vi.fn();
const useOrder = vi.fn();
const useDemoAuth = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("~/features/shop/hooks/use-orders", () => ({
  useOrder: (code: string) => useOrder(code),
}));

vi.mock("~/features/shop/hooks/use-demo-auth", () => ({
  useDemoAuth: () => useDemoAuth(),
}));

vi.mock("~/features/shop/hooks/use-mini-cart", () => ({
  useMiniCart: () => ({ add }),
}));

vi.mock("~/features/shop/lib/order-store", () => ({
  updateOrderStatus: (...args: unknown[]) => updateOrderStatus(...args),
}));

vi.mock("~/features/shop/components/orders/payment-proof-uploader", () => ({
  PaymentProofUploader: ({
    onStatusChange,
  }: {
    onStatusChange?: (status: string) => void;
  }) => (
    <button
      type="button"
      onClick={() => onStatusChange?.("pending_verification")}
    >
      upload-proof
    </button>
  ),
}));

const pendingOrder = ORDERS.find((item) => item.status === "pending_payment");

beforeEach(() => {
  vi.clearAllMocks();
  useOrder.mockReturnValue(pendingOrder);
  useDemoAuth.mockReturnValue({ isCustomer: false });
});

describe("OrderStatusPage", () => {
  it("renders the summary and masks personal data for guests", async () => {
    if (!pendingOrder) throw new Error("pending order missing");
    render(<OrderStatusPage code={pendingOrder.code} onLookup={vi.fn()} />);

    expect(await screen.findByText(pendingOrder.code)).toBeInTheDocument();
    expect(screen.getAllByText("Status Pesanan")).toHaveLength(2);
    expect(
      screen.getByText(maskOrderName(pendingOrder.recipientName)),
    ).toBeInTheDocument();
  });

  it("shows full personal data for customers", async () => {
    if (!pendingOrder) throw new Error("pending order missing");
    useDemoAuth.mockReturnValue({ isCustomer: true });
    render(<OrderStatusPage code={pendingOrder.code} onLookup={vi.fn()} />);

    expect(
      await screen.findByText(pendingOrder.recipientName),
    ).toBeInTheDocument();
  });

  it("shows the not-found state and forwards lookups", async () => {
    const onLookup = vi.fn();
    useOrder.mockReturnValue(null);
    render(<OrderStatusPage code="DLF-UNKNOWN" onLookup={onLookup} />);

    expect(
      await screen.findByText("Pesanan tidak ditemukan"),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Kode pesanan"), {
      target: { value: "dlf-20261024-8842" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lacak" }));
    expect(onLookup).toHaveBeenCalledWith("DLF-20261024-8842");
  });

  it("updates the order after a successful proof upload", async () => {
    if (!pendingOrder) throw new Error("pending order missing");
    render(<OrderStatusPage code={pendingOrder.code} onLookup={vi.fn()} />);

    fireEvent.click(
      await screen.findByRole("button", { name: "upload-proof" }),
    );
    expect(updateOrderStatus).toHaveBeenCalledWith(
      pendingOrder.code,
      "pending_verification",
      { note: "Bukti pembayaran diunggah" },
    );
  });

  it("reorders every item and navigates to the cart", async () => {
    if (!pendingOrder) throw new Error("pending order missing");
    render(<OrderStatusPage code={pendingOrder.code} onLookup={vi.fn()} />);

    fireEvent.click(await screen.findByRole("button", { name: "Pesan lagi" }));
    for (const line of pendingOrder.items) {
      expect(add).toHaveBeenCalledWith(line);
    }
    expect(navigate).toHaveBeenCalledWith({ to: "/keranjang" });
  });
});

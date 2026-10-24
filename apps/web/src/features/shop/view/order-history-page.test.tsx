import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { createDemoOrders } from "~/features/shop/data/orders";
import type { OrderHistorySearch } from "~/features/shop/schemas/order-history-search-schema";
import { OrderHistoryPage } from "./order-history-page";

const NOW = new Date("2026-10-24T12:00:00.000Z");
const DEMO_ORDERS = createDemoOrders(NOW);
const pendingOrder = DEMO_ORDERS.find(
  (order) => order.status === "pending_payment",
);
const deliveredOrder = DEMO_ORDERS.find(
  (order) => order.status === "delivered",
);
if (!pendingOrder || !deliveredOrder) {
  throw new Error("demo orders missing");
}

const ORDERS = [
  pendingOrder,
  deliveredOrder,
  ...DEMO_ORDERS.filter(
    (order) =>
      order.code !== pendingOrder.code && order.code !== deliveredOrder.code,
  ),
];

const SEARCH: OrderHistorySearch = {
  period: "30d",
  sort: "newest",
  status: "all",
  page: 1,
};

const navigate = vi.fn();
const add = vi.fn();
const setMode = vi.fn();
const useOrders = vi.fn();
const useDemoAuth = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("~/features/shop/hooks/use-orders", () => ({
  useOrders: () => useOrders(),
}));

vi.mock("~/features/shop/hooks/use-demo-auth", () => ({
  useDemoAuth: () => useDemoAuth(),
}));

vi.mock("~/features/shop/hooks/use-mini-cart", () => ({
  useMiniCart: () => ({ add }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  useOrders.mockReturnValue({ orders: ORDERS });
  useDemoAuth.mockReturnValue({ isCustomer: false, setMode });
});

describe("OrderHistoryPage", () => {
  it("locks the history for guests without listing orders", async () => {
    render(<OrderHistoryPage search={SEARCH} onSearchChange={vi.fn()} />);

    expect(
      await screen.findByText("Riwayat pesanan terkunci"),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("article")).toHaveLength(0);

    fireEvent.click(
      screen.getByRole("button", { name: "Aktifkan login demo" }),
    );
    expect(setMode).toHaveBeenCalledWith("customer");
  });

  it("renders the customer history with four cards and pagination", async () => {
    useDemoAuth.mockReturnValue({ isCustomer: true, setMode });
    render(<OrderHistoryPage search={SEARCH} onSearchChange={vi.fn()} />);

    expect(
      await screen.findByRole("heading", { name: "Pesanan Saya" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Cari pesanan")).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Filter status pesanan" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(4);
    expect(screen.getByText(/Menampilkan/)).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Pagination riwayat pesanan" }),
    ).toBeInTheDocument();
  });

  it("forwards search changes after the debounce", async () => {
    const onSearchChange = vi.fn();
    useDemoAuth.mockReturnValue({ isCustomer: true, setMode });
    render(
      <OrderHistoryPage search={SEARCH} onSearchChange={onSearchChange} />,
    );

    const input = await screen.findByLabelText("Cari pesanan");
    fireEvent.change(input, { target: { value: "wisuda" } });
    await waitFor(
      () =>
        expect(onSearchChange).toHaveBeenCalledWith({
          q: "wisuda",
          page: 1,
        }),
      { timeout: 1000 },
    );
  });

  it("resets the page when the status tab changes", async () => {
    const onSearchChange = vi.fn();
    useDemoAuth.mockReturnValue({ isCustomer: true, setMode });
    render(
      <OrderHistoryPage search={SEARCH} onSearchChange={onSearchChange} />,
    );

    fireEvent.click(await screen.findByRole("button", { name: /Selesai/ }));
    expect(onSearchChange).toHaveBeenCalledWith({
      status: "delivered",
      page: 1,
    });
  });

  it("forwards pagination changes", async () => {
    const onSearchChange = vi.fn();
    useDemoAuth.mockReturnValue({ isCustomer: true, setMode });
    render(
      <OrderHistoryPage search={SEARCH} onSearchChange={onSearchChange} />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Ke halaman 2" }),
    );
    expect(onSearchChange).toHaveBeenCalledWith({ page: 2 });
  });

  it("shows the empty state when filters match nothing", async () => {
    useDemoAuth.mockReturnValue({ isCustomer: true, setMode });
    render(
      <OrderHistoryPage
        search={{ ...SEARCH, q: "tidak-ada" }}
        onSearchChange={vi.fn()}
      />,
    );

    expect(await screen.findByText("Belum ada pesanan")).toBeInTheDocument();
    expect(screen.queryAllByRole("article")).toHaveLength(0);
  });

  it("opens an order from its card action", async () => {
    useDemoAuth.mockReturnValue({ isCustomer: true, setMode });
    render(<OrderHistoryPage search={SEARCH} onSearchChange={vi.fn()} />);

    const card = (await screen.findAllByRole("article"))[0];
    fireEvent.click(
      within(card).getByRole("button", { name: "Bayar sekarang" }),
    );
    expect(navigate).toHaveBeenCalledWith({
      to: "/status-pesanan/$kodePesanan",
      params: { kodePesanan: pendingOrder.code },
    });
  });

  it("reorders every item and navigates to the cart", async () => {
    useDemoAuth.mockReturnValue({ isCustomer: true, setMode });
    render(
      <OrderHistoryPage
        search={{ ...SEARCH, status: "delivered" }}
        onSearchChange={vi.fn()}
      />,
    );

    const card = (await screen.findAllByRole("article"))[0];
    fireEvent.click(within(card).getByRole("button", { name: "Pesan lagi" }));
    for (const line of deliveredOrder.items) {
      expect(add).toHaveBeenCalledWith(line);
    }
    expect(navigate).toHaveBeenCalledWith({ to: "/keranjang" });
  });
});

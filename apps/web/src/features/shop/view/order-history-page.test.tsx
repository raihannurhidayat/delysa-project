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
const useOrders = vi.fn();
const useSession = vi.fn();

const CUSTOMER = {
  id: 1,
  name: "Sari Amelia",
  email: "sari@example.com",
  role: "customer",
};

vi.mock("@tanstack/react-router", async () => {
  const React = await import("react");
  return {
    useNavigate: () => navigate,
    Link: ({
      to,
      children,
      ...props
    }: {
      to: string;
      children: React.ReactNode;
    }) => React.createElement("a", { href: to, ...props }, children),
  };
});

vi.mock("~/features/shop/hooks/use-orders", () => ({
  useOrders: () => useOrders(),
}));

vi.mock("~/features/auth/hooks/use-session", () => ({
  useSession: () => useSession(),
}));

vi.mock("~/features/shop/hooks/use-mini-cart", () => ({
  useMiniCart: () => ({ add }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  useOrders.mockReturnValue({ orders: ORDERS });
  useSession.mockReturnValue({ user: null });
});

describe("OrderHistoryPage", () => {
  it("locks the history for guests without listing orders", async () => {
    render(<OrderHistoryPage search={SEARCH} onSearchChange={vi.fn()} />);

    expect(
      await screen.findByText("Riwayat pesanan terkunci"),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("article")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Masuk ke akun" }));
    expect(navigate).toHaveBeenCalledWith({ to: "/sign-in" });
  });

  it("shows a role notice for non-customer accounts", async () => {
    useSession.mockReturnValue({
      user: { ...CUSTOMER, id: 2, role: "store_owner" },
    });
    render(<OrderHistoryPage search={SEARCH} onSearchChange={vi.fn()} />);

    expect(
      await screen.findByText("Riwayat pelanggan tidak tersedia"),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("article")).toHaveLength(0);
    expect(
      screen.getByRole("link", { name: "Kembali ke dasbor" }),
    ).toHaveAttribute("href", "/toko");
  });

  it("renders the customer history with four cards and pagination", async () => {
    useSession.mockReturnValue({ user: CUSTOMER });
    render(<OrderHistoryPage search={SEARCH} onSearchChange={vi.fn()} />);

    expect(
      await screen.findByRole("heading", { name: "Pesanan Saya" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Halo, Sari")).toBeInTheDocument();
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
    useSession.mockReturnValue({ user: CUSTOMER });
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
    useSession.mockReturnValue({ user: CUSTOMER });
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
    useSession.mockReturnValue({ user: CUSTOMER });
    render(
      <OrderHistoryPage search={SEARCH} onSearchChange={onSearchChange} />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Ke halaman 2" }),
    );
    expect(onSearchChange).toHaveBeenCalledWith({ page: 2 });
  });

  it("shows the empty state when filters match nothing", async () => {
    useSession.mockReturnValue({ user: CUSTOMER });
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
    useSession.mockReturnValue({ user: CUSTOMER });
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
    useSession.mockReturnValue({ user: CUSTOMER });
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

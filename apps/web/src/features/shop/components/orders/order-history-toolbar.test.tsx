import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { OrderHistoryToolbar } from "./order-history-toolbar";

const baseProps = {
  period: "30d" as const,
  sort: "newest" as const,
  resultCount: 12,
};

afterEach(() => {
  vi.useRealTimers();
});

describe("OrderHistoryToolbar", () => {
  it("debounces search changes for 300ms and resets the page", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<OrderHistoryToolbar {...baseProps} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Cari pesanan"), {
      target: { value: "wisuda" },
    });
    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onChange).toHaveBeenCalledWith({ q: "wisuda", page: 1 });
  });

  it("sends an undefined query when the search is cleared", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(
      <OrderHistoryToolbar {...baseProps} q="wisuda" onChange={onChange} />,
    );

    fireEvent.change(screen.getByLabelText("Cari pesanan"), {
      target: { value: "  " },
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onChange).toHaveBeenCalledWith({ q: undefined, page: 1 });
  });

  it("changes the period and resets the page", async () => {
    const onChange = vi.fn();
    render(<OrderHistoryToolbar {...baseProps} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText("Periode"));
    const option = await screen.findByRole("option", { name: "90 hari" });
    fireEvent.pointerDown(option, { pointerType: "mouse" });
    fireEvent.click(option, { detail: 1 });
    expect(onChange).toHaveBeenCalledWith({ period: "90d", page: 1 });
  });

  it("changes the sort order and resets the page", async () => {
    const onChange = vi.fn();
    render(<OrderHistoryToolbar {...baseProps} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText("Urutkan"));
    const option = await screen.findByRole("option", {
      name: "Total tertinggi",
    });
    fireEvent.pointerDown(option, { pointerType: "mouse" });
    fireEvent.click(option, { detail: 1 });
    expect(onChange).toHaveBeenCalledWith({ sort: "total_desc", page: 1 });
  });

  it("announces the result count", () => {
    render(<OrderHistoryToolbar {...baseProps} onChange={vi.fn()} />);
    expect(screen.getByText("12 pesanan ditemukan")).toBeInTheDocument();
  });
});

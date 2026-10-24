import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CatalogPagination } from "./catalog-pagination";

describe("CatalogPagination", () => {
  it("keeps the catalog defaults", () => {
    render(
      <CatalogPagination
        page={1}
        pageCount={2}
        total={10}
        pageSize={4}
        onPage={vi.fn()}
      />,
    );
    expect(screen.getByText(/produk buket & rangkaian/)).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Pagination katalog" }),
    ).toBeInTheDocument();
  });

  it("accepts custom labels and calls onPage", () => {
    const onPage = vi.fn();
    render(
      <CatalogPagination
        page={1}
        pageCount={2}
        total={10}
        pageSize={4}
        onPage={onPage}
        itemLabel="pesanan"
        ariaLabel="Pagination riwayat pesanan"
      />,
    );
    expect(screen.getByText(/pesanan/)).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Pagination riwayat pesanan" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Halaman berikutnya" }));
    expect(onPage).toHaveBeenCalledWith(2);
  });

  it("disables boundary buttons", () => {
    render(
      <CatalogPagination
        page={2}
        pageCount={2}
        total={10}
        pageSize={4}
        onPage={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Halaman berikutnya" }),
    ).toBeDisabled();
  });
});

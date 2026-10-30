import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminProductsPage } from "./admin-products-page";
import { MOCK_PRODUCTS } from "../lib/mock-products";

function renderPage() {
  return render(<AdminProductsPage />);
}

describe("AdminProductsPage", () => {
  it("renders stats, filters, and paginated product rows from mock data", () => {
    renderPage();

    expect(screen.getByText("Peringatan Low-Stock")).toBeInTheDocument();
    expect(screen.getByText(/12 Out of Stock|2 Out of Stock/)).toBeInTheDocument();
    expect(
      screen.getAllByRole("row").length,
    ).toBeGreaterThan(1); // header + first page rows
    expect(
      screen.getByText("Menampilkan 1–8 dari 12 produk"),
    ).toBeInTheDocument();
  });

  it("filters rows and resets to the first page", () => {
    renderPage();

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Cari nama produk atau SKU" }),
      { target: { value: "df-brid" } },
    );

    // Satu-satunya baris hasil filter tampil; pagination disembunyikan (1 halaman).
    expect(screen.queryByRole("navigation", { name: "Navigasi halaman produk" })).not.toBeInTheDocument();
    expect(screen.getByRole("row", { name: /L'Amour Bridal Hand-Tied/ })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /Serenade Pastel/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
  });

  it("adds a product through the create dialog", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /Tambah Produk/ }));
    fireEvent.input(screen.getByLabelText("Nama Produk"), {
      target: { value: "Buket Uji Baru" },
    });
    fireEvent.input(screen.getByLabelText("SKU"), {
      target: { value: "DF-UJI-999" },
    });
    fireEvent.input(screen.getByLabelText("Harga (Rp)"), {
      target: { value: "175000" },
    });
    fireEvent.input(screen.getByLabelText("Stok"), {
      target: { value: "4" },
    });
    fireEvent.input(screen.getByLabelText("Satuan Stok"), {
      target: { value: "Buket" },
    });
    fireEvent.input(screen.getByLabelText("Threshold Minimum"), {
      target: { value: "2" },
    });
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Tambah Produk",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("row", { name: /Buket Uji Baru/ }),
      ).toBeInTheDocument();
    });
  });

  it("updates stock through the edit dialog", async () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: `Edit produk ${MOCK_PRODUCTS[0]?.name}`,
      }),
    );
    fireEvent.input(screen.getByLabelText("Stok"), {
      target: { value: "2" },
    });
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Simpan Perubahan",
      }),
    );

    await waitFor(() => {
      const row = screen.getByRole("row", {
        name: new RegExp(MOCK_PRODUCTS[0]!.name),
      });
      expect(within(row).getByText("Menipis")).toBeInTheDocument();
    });
  });

  it("pages to the second page of the catalog", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Halaman 2" }));

    expect(
      screen.getByText("Menampilkan 9–12 dari 12 produk"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /The Grand Monolith/ })).not.toBeInTheDocument();
  });
});

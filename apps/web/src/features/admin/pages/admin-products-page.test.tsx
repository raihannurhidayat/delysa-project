import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminProductsPage } from "./admin-products-page";

const downloadProductsCsv = vi.hoisted(() => vi.fn());

vi.mock("../lib/products/product-export", () => ({
  downloadProductsCsv,
}));

function renderPage() {
  return render(<AdminProductsPage />);
}

function firstDataRow() {
  const rows = screen.getAllByRole("row");
  const row = rows[1];
  if (!row) throw new Error("Tabel tidak memiliki baris data");
  return row;
}

beforeEach(() => {
  downloadProductsCsv.mockClear();
});

describe("AdminProductsPage", () => {
  it("renders the catalog header, statistics, stock tabs, and first page", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Produk", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Total Produk")).toBeInTheDocument();
    expect(screen.getByText("Pendapatan Produk")).toBeInTheDocument();
    expect(screen.getByText("Produk Terjual")).toBeInTheDocument();
    expect(screen.getByText("Peringatan Stok")).toBeInTheDocument();

    expect(
      screen.getByRole("tab", { name: "Semua Produk (12)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Habis (2)" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Menipis (4)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Aman (6)" })).toBeInTheDocument();

    expect(
      screen.getByText("Menampilkan 1–8 dari 12 produk"),
    ).toBeInTheDocument();
    expect(firstDataRow()).toHaveTextContent("The Grand Monolith");
  });

  it("filters by search, resets pagination, and exports the filtered rows", () => {
    renderPage();

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Cari nama produk atau SKU" }),
      { target: { value: "df-brid" } },
    );

    expect(
      screen.queryByRole("navigation", { name: "Navigasi halaman produk" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("row", { name: /L'Amour Bridal/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("row", { name: /Serenade Pastel/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Export/ }));

    expect(downloadProductsCsv).toHaveBeenCalledTimes(1);
    const rows = downloadProductsCsv.mock.calls[0]?.[0] as unknown[];
    expect(rows).toHaveLength(1);
  });

  it("filters rows through the stock tabs", () => {
    renderPage();

    fireEvent.click(screen.getByRole("tab", { name: "Habis (2)" }));

    expect(screen.getAllByRole("row")).toHaveLength(3); // header + 2 rows
    expect(
      screen.queryByRole("navigation", { name: "Navigasi halaman produk" }),
    ).not.toBeInTheDocument();
  });

  it("sorts rows when a sortable header is activated", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /Harga/ }));

    expect(firstDataRow()).toHaveTextContent("Aura Botanical Grand Stand");

    fireEvent.click(screen.getByRole("button", { name: /Harga/ }));

    expect(firstDataRow()).toHaveTextContent("Whisper Baby Breath Bundle");
  });

  it("tracks row selection and clears it", () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Pilih The Grand Monolith Peach & Ivory",
      }),
    );

    expect(screen.getByText("1 produk dipilih")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Bersihkan pilihan" }));

    expect(screen.queryByText("1 produk dipilih")).not.toBeInTheDocument();
  });

  it("selects every row on the page with the header checkbox", () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Pilih semua produk di halaman ini",
      }),
    );

    expect(screen.getByText("8 produk dipilih")).toBeInTheDocument();
  });

  it("moves between pages", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Halaman 2" }));

    expect(
      screen.getByText("Menampilkan 9–12 dari 12 produk"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("row", { name: /The Grand Monolith/ }),
    ).not.toBeInTheDocument();
  });

  it("hides statistics and optional columns from the toolbar", async () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("switch", { name: "Tampilkan statistik" }),
    );
    expect(screen.queryByText("Total Produk")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Customize View/ }));
    const categoryItem = await screen.findByRole("menuitemcheckbox", {
      name: "Kategori",
    });
    fireEvent.click(categoryItem);

    await waitFor(() => {
      expect(
        screen.queryByRole("columnheader", { name: /Kategori/ }),
      ).not.toBeInTheDocument();
    });
  });

  it("adds a product through the create dialog", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /Tambah Produk/ }));

    const dialog = screen.getByRole("dialog");

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
    fireEvent.input(screen.getByLabelText("Jumlah Terjual"), {
      target: { value: "9" },
    });
    fireEvent.input(screen.getByLabelText("Rating (0–5)"), {
      target: { value: "4.6" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Tambah Produk" }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("row", { name: /Buket Uji Baru/ }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Total Produk")).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Semua Produk (13)" }),
    ).toBeInTheDocument();
  });

  it("updates stock through the edit dialog", async () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit produk The Grand Monolith Peach & Ivory",
      }),
    );

    const dialog = screen.getByRole("dialog");
    fireEvent.input(screen.getByLabelText("Stok"), {
      target: { value: "2" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Simpan Perubahan" }),
    );

    await waitFor(() => {
      const row = screen.getByRole("row", {
        name: /The Grand Monolith Peach & Ivory/,
      });
      expect(within(row).getByText("Menipis")).toBeInTheDocument();
    });
  });
});

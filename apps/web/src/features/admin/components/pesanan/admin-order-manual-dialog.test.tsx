import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ManualOrderFormValues } from "../../lib/pesanan/manual-order";
import { AdminOrderManualDialog } from "./admin-order-manual-dialog";

function renderDialog(onSubmit: (values: ManualOrderFormValues) => void) {
  render(
    <AdminOrderManualDialog
      open={true}
      onOpenChange={() => {}}
      onSubmit={onSubmit}
    />,
  );
}

const VALID_VALUES = {
  itemName: "Buket Mawar Wisuda",
  itemQty: 2,
  itemPrice: 370000,
  recipientName: "Amelia Lestari",
  recipientPhone: "0812-3456-7890",
  shippingAddress: "Jl. HZ Mustofa No. 10, Tasikmalaya",
  customNote: "",
};

describe("AdminOrderManualDialog", () => {
  it("shows per-field validation errors when submitted empty", async () => {
    renderDialog(vi.fn());

    fireEvent.click(screen.getByRole("button", { name: "Simpan Pesanan" }));

    await waitFor(() => {
      expect(
        screen.getByText("Nama produk minimal 2 karakter"),
      ).toBeInTheDocument();
    });
  });

  it("submits typed values through onSubmit", async () => {
    const onSubmit = vi.fn<(values: ManualOrderFormValues) => void>();
    renderDialog(onSubmit);

    fireEvent.change(screen.getByLabelText("Nama Produk"), {
      target: { value: VALID_VALUES.itemName },
    });
    fireEvent.change(screen.getByLabelText("Jumlah"), {
      target: { value: String(VALID_VALUES.itemQty) },
    });
    fireEvent.change(screen.getByLabelText("Harga (Rp)"), {
      target: { value: String(VALID_VALUES.itemPrice) },
    });
    fireEvent.change(screen.getByLabelText("Nama Penerima"), {
      target: { value: VALID_VALUES.recipientName },
    });
    fireEvent.change(screen.getByLabelText("Nomor WhatsApp"), {
      target: { value: VALID_VALUES.recipientPhone },
    });
    fireEvent.change(screen.getByLabelText("Alamat Pengiriman"), {
      target: { value: VALID_VALUES.shippingAddress },
    });

    fireEvent.click(screen.getByRole("button", { name: "Simpan Pesanan" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const values = onSubmit.mock.calls[0]?.[0];
    expect(values).toMatchObject({
      itemName: VALID_VALUES.itemName,
      itemQty: VALID_VALUES.itemQty,
      itemPrice: VALID_VALUES.itemPrice,
      recipientName: VALID_VALUES.recipientName,
      recipientPhone: VALID_VALUES.recipientPhone,
      shippingAddress: VALID_VALUES.shippingAddress,
    });
  });

  it("marks required qty range invalid", async () => {
    renderDialog(vi.fn());

    fireEvent.change(screen.getByLabelText("Nama Produk"), {
      target: { value: VALID_VALUES.itemName },
    });
    fireEvent.change(screen.getByLabelText("Jumlah"), {
      target: { value: 0 },
    });
    fireEvent.change(screen.getByLabelText("Harga (Rp)"), {
      target: { value: 370000 },
    });
    fireEvent.change(screen.getByLabelText("Nama Penerima"), {
      target: { value: VALID_VALUES.recipientName },
    });
    fireEvent.change(screen.getByLabelText("Nomor WhatsApp"), {
      target: { value: VALID_VALUES.recipientPhone },
    });
    fireEvent.change(screen.getByLabelText("Alamat Pengiriman"), {
      target: { value: VALID_VALUES.shippingAddress },
    });

    fireEvent.click(screen.getByRole("button", { name: "Simpan Pesanan" }));

    await waitFor(() => {
      expect(screen.getByText("Jumlah minimal 1")).toBeInTheDocument();
    });
  });
});

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { describe, it, expect, vi } from "vitest";
import { AlamatStep } from "./AlamatStep";
import {
  checkoutFormSchema,
  DEFAULT_CHECKOUT_FORM,
  type CheckoutFormData,
} from "../../schemas";

function Harness({ onNext }: { onNext?: () => void }) {
  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { ...DEFAULT_CHECKOUT_FORM, step: "alamat" },
    mode: "onChange",
  });

  return (
    <FormProvider {...form}>
      <AlamatStep
        onBack={vi.fn()}
        onNext={() => {
          void form.trigger([
            "recipientName",
            "recipientPhone",
            "shippingAddress",
          ]);
          onNext?.();
        }}
      />
    </FormProvider>
  );
}

describe("AlamatStep", () => {
  it("renders the recipient fields", () => {
    render(<Harness />);
    expect(screen.getByLabelText(/Nama Penerima/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nomor HP\/WhatsApp/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Alamat Lengkap/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Catatan untuk Kurir/)).toBeInTheDocument();
  });

  it("shows Indonesian validation messages for empty fields", async () => {
    const onNext = vi.fn();
    render(<Harness onNext={onNext} />);

    fireEvent.click(
      screen.getByRole("button", { name: /Lanjut ke Pembayaran/ }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Nama penerima minimal 2 karakter"),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Nomor HP minimal 9 digit")).toBeInTheDocument();
    expect(screen.getByText("Alamat minimal 10 karakter")).toBeInTheDocument();
  });
});

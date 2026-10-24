import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const { mockUpload } = vi.hoisted(() => ({ mockUpload: vi.fn() }));

vi.mock("~/features/checkout/api/endpoints", () => ({
  uploadPaymentProof: mockUpload,
}));

import { PaymentProofUploader } from "./payment-proof-uploader";

function imageFile(name = "proof.png", size = 1024, type = "image/png") {
  return new File([new Uint8Array(size)], name, { type });
}

describe("PaymentProofUploader", () => {
  beforeEach(() => {
    mockUpload.mockReset();
  });

  it("shows the upload controls for pending payment", () => {
    render(<PaymentProofUploader orderId={42} status="pending_payment" />);
    expect(screen.getByTestId("payment-proof-input")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Kirim bukti pembayaran" }),
    ).toBeInTheDocument();
  });

  it("uploads a valid file and reports the new status", async () => {
    mockUpload.mockResolvedValue({
      id: 42,
      code: "DLF-20261024-ABCD",
      status: "pending_verification",
      total: 175000,
    });
    const onStatusChange = vi.fn();
    render(
      <PaymentProofUploader
        orderId={42}
        status="pending_payment"
        onStatusChange={onStatusChange}
      />,
    );

    fireEvent.change(screen.getByTestId("payment-proof-input"), {
      target: { files: [imageFile()] },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Kirim bukti pembayaran" }),
    );

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith(42, expect.any(File));
    });
    expect(onStatusChange).toHaveBeenCalledWith("pending_verification");
    expect(
      await screen.findByText("Bukti pembayaran diterima"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("payment-proof-input")).not.toBeInTheDocument();
  });

  it("rejects oversized and unsupported files before uploading", () => {
    render(<PaymentProofUploader orderId={42} status="pending_payment" />);

    fireEvent.change(screen.getByTestId("payment-proof-input"), {
      target: { files: [imageFile("besar.png", 6 * 1024 * 1024)] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ukuran file maksimal 5MB.",
    );

    fireEvent.change(screen.getByTestId("payment-proof-input"), {
      target: { files: [imageFile("catatan.txt", 1024, "text/plain")] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Gunakan file JPG, PNG, atau WEBP.",
    );
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("shows the summary without an input for pending verification", () => {
    render(<PaymentProofUploader orderId={42} status="pending_verification" />);
    expect(screen.getByText("Bukti pembayaran diterima")).toBeInTheDocument();
    expect(screen.queryByTestId("payment-proof-input")).not.toBeInTheDocument();
  });

  it("renders nothing for statuses that cannot upload", () => {
    const { container } = render(
      <PaymentProofUploader orderId={42} status="paid" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("keeps the file selected after a failed upload so it can retry", async () => {
    mockUpload.mockRejectedValueOnce(new Error("Server sedang sibuk"));
    render(<PaymentProofUploader orderId={42} status="pending_payment" />);

    fireEvent.change(screen.getByTestId("payment-proof-input"), {
      target: { files: [imageFile()] },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Kirim bukti pembayaran" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Server sedang sibuk",
    );
    expect(
      screen.getByRole("button", { name: "Kirim bukti pembayaran" }),
    ).toBeEnabled();
  });
});

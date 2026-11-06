import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminOrderAtelierStepper } from "./admin-order-atelier-stepper";

describe("AdminOrderAtelierStepper", () => {
  it("renders 4 atelier steps", () => {
    render(<AdminOrderAtelierStepper status="pending_verification" />);

    expect(screen.getByText("Menunggu Verifikasi")).toBeInTheDocument();
    expect(screen.getByText("Sedang Dikerjakan")).toBeInTheDocument();
    expect(screen.getByText("Dalam Pengantaran")).toBeInTheDocument();
    expect(screen.getByText("Selesai Terkirim")).toBeInTheDocument();
  });

  it("marks first step active for pending_verification", () => {
    render(<AdminOrderAtelierStepper status="pending_verification" />);

    const el = screen.getByText("Menunggu Verifikasi");
    expect(el).toHaveClass("bg-[#FFF3ED]");
  });

  it("marks second step active for processing", () => {
    render(<AdminOrderAtelierStepper status="processing" />);

    const el = screen.getByText("Sedang Dikerjakan");
    expect(el).toHaveClass("bg-[#FFF3ED]");
  });

  it("marks third step active for shipped", () => {
    render(<AdminOrderAtelierStepper status="shipped" />);

    const el = screen.getByText("Dalam Pengantaran");
    expect(el).toHaveClass("bg-[#FFF3ED]");
  });

  it("marks all steps done for delivered", () => {
    render(<AdminOrderAtelierStepper status="delivered" />);

    const el = screen.getByText("Selesai Terkirim");
    expect(el).toHaveClass("bg-emerald-100");
  });
});

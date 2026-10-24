import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const { mockCopyText } = vi.hoisted(() => ({ mockCopyText: vi.fn() }));

vi.mock("~/features/shop/lib/clipboard", () => ({
  copyText: mockCopyText,
}));

import { CopyOrderCodeButton } from "./copy-order-code-button";

describe("CopyOrderCodeButton", () => {
  it("copies the code and exposes an accessible label", () => {
    mockCopyText.mockResolvedValue(true);
    render(<CopyOrderCodeButton code="DLF-20261024-8842" />);
    const button = screen.getByRole("button", {
      name: /DLF-20261024-8842/,
    });
    fireEvent.click(button);
    expect(mockCopyText).toHaveBeenCalledWith(
      "DLF-20261024-8842",
      "Kode pesanan",
    );
  });
});

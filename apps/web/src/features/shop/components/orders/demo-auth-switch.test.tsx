import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DemoAuthSwitch } from "./demo-auth-switch";
import { setDemoAuthMode } from "~/features/shop/lib/demo-auth-store";

describe("DemoAuthSwitch", () => {
  beforeEach(() => {
    localStorage.clear();
    setDemoAuthMode("guest");
  });

  it("renders both modes", () => {
    render(<DemoAuthSwitch />);
    expect(
      screen.getByRole("group", { name: "Mode demo akun" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anonim" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Login demo" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("switches to the customer demo", () => {
    render(<DemoAuthSwitch />);
    fireEvent.click(screen.getByRole("button", { name: "Login demo" }));
    expect(screen.getByRole("button", { name: "Login demo" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(localStorage.getItem("delysa:demo-auth:v1")).toBe("customer");
  });

  it("switches back to anonymous", () => {
    render(<DemoAuthSwitch />);
    fireEvent.click(screen.getByRole("button", { name: "Login demo" }));
    fireEvent.click(screen.getByRole("button", { name: "Anonim" }));
    expect(screen.getByRole("button", { name: "Anonim" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(localStorage.getItem("delysa:demo-auth:v1")).toBe("guest");
  });
});

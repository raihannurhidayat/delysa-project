import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Heart, Star } from "lucide-react";
import { DEFAULT_TRUST_ITEMS, TrustStrip } from "./trust-strip";

describe("TrustStrip", () => {
  it("renders the four default items", () => {
    render(<TrustStrip />);
    expect(
      screen.getByRole("region", { name: "Keunggulan toko" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(
      DEFAULT_TRUST_ITEMS.length,
    );
  });

  it("renders custom items and aria label", () => {
    render(
      <TrustStrip
        ariaLabel="Keunggulan pesanan"
        items={[
          { title: "Aman", subtitle: "Terverifikasi", icon: Star },
          { title: "Segar", subtitle: "Setiap hari", icon: Heart },
          { title: "Cepat", subtitle: "Same day", icon: Star },
        ]}
      />,
    );
    expect(
      screen.getByRole("region", { name: "Keunggulan pesanan" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("Segar")).toBeInTheDocument();
  });
});

import { expect, test } from "@playwright/test";

// Toolbar katalog (/katalog): di mobile (<md) search + kedua select bertumpuk
// kolom dan full-width; di desktop (≥md) tetap sebaris. Assertion memakai
// computed style + bounding box dari SSR HTML (tanpa interaksi JS).

test("toolbar bertumpuk kolom full-width di mobile 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/katalog");
  await expect(
    page.getByRole("searchbox", { name: "Filter nama buket" }),
  ).toBeVisible();

  const layout = await page.evaluate(() => {
    const search = document.querySelector(
      'input[aria-label="Filter nama buket"]',
    );
    const row = search?.parentElement?.parentElement ?? null;
    const triggers = [
      ...document.querySelectorAll(
        'button[aria-label="Filter kategori cepat"]',
      ),
      ...document.querySelectorAll('button[aria-label="Urutkan produk"]'),
    ];
    const clientWidth = document.documentElement.clientWidth;
    return {
      direction: row ? getComputedStyle(row).flexDirection : "unknown",
      clientWidth,
      widths: triggers.map((el) => el.getBoundingClientRect().width),
      searchWidth: search?.getBoundingClientRect().width ?? 0,
    };
  });

  expect(layout.direction).toBe("column");
  // Full-width: toleransi padding container (px-4 = 32) + pembulatan.
  expect(layout.searchWidth).toBeGreaterThanOrEqual(layout.clientWidth - 40);
  expect(layout.widths).toHaveLength(2);
  for (const w of layout.widths) {
    expect(w).toBeGreaterThanOrEqual(layout.clientWidth - 40);
  }
});

test("toolbar sebaris di desktop 1280px", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/katalog");
  await expect(
    page.getByRole("searchbox", { name: "Filter nama buket" }),
  ).toBeVisible();

  const direction = await page.evaluate(() => {
    const search = document.querySelector(
      'input[aria-label="Filter nama buket"]',
    );
    const row = search?.parentElement?.parentElement ?? null;
    return row ? getComputedStyle(row).flexDirection : "unknown";
  });
  expect(direction).toBe("row");
});

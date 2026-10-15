import { expect, test, type Page } from "@playwright/test";

// CardProduct: seluruh kartu berperan sebagai link ke detail produk
// (sementara alert UI-only). Tidak ada tombol beli lagi.

test.use({ viewport: { width: 390, height: 844 } });
// Lihat mobile-nav.spec.ts: hidrasi React lambat di dev dingin.
test.setTimeout(120_000);

function firstCard(page: Page) {
  return page.getByRole("link", { name: /Lihat detail/ }).first();
}

async function waitHydrated(page: Page) {
  await page.goto("/katalog");
  await expect(firstCard(page)).toBeVisible();
  await page.waitForTimeout(12_000);
}

test("klik kartu membuka placeholder detail (alert), tanpa tombol beli", async ({
  page,
}) => {
  const messages: string[] = [];
  page.on("dialog", async (d) => {
    messages.push(d.message());
    await d.dismiss();
  });
  await waitHydrated(page);

  // Tombol beli sudah dihapus dari semua kartu.
  await expect(
    page.getByRole("button", { name: /beli \(segera hadir\)|stok habis/i }),
  ).toHaveCount(0);

  await firstCard(page).click();
  await expect
    .poll(() => messages[0] ?? "", { timeout: 10_000 })
    .toBe("Detail produk segera hadir (UI-only)");
});

test("kartu berkursor pointer dan bisa dibuka via keyboard", async ({
  page,
}) => {
  const messages: string[] = [];
  page.on("dialog", async (d) => {
    messages.push(d.message());
    await d.dismiss();
  });
  await waitHydrated(page);

  const card = firstCard(page);
  await expect
    .poll(() => card.evaluate((el) => getComputedStyle(el).cursor))
    .toBe("pointer");

  await card.focus();
  await page.keyboard.press("Enter");
  await expect
    .poll(() => messages[0] ?? "", { timeout: 10_000 })
    .toBe("Detail produk segera hadir (UI-only)");
});

import { expect, test, type Locator, type Page } from "@playwright/test";

// Navigasi mobile ShopHeader: hamburger drawer + search baris kedua.
// Lihat docs/superpowers/plans/2026-10-15-navigasi-mobile-shop-header.md §2 (AC).
//
// Catatan: homepage mengalami hydration-mismatch pra-eksisting (client
// me-regenerate tree, lambat di dev) sehingga klik pertama bisa mendarat
// sebelum React terhidrasi. `ensureInteractive` menunggu sampai satu
// interaksi terbukti diproses sebelum assertion perilaku.

test.use({ viewport: { width: 390, height: 844 } });
// Dev server dingin (transform awal Vite + hydration-regen akibat mismatch
// pra-eksisting) bisa lambat; beri ruang agar tidak flaky.
test.setTimeout(120_000);

function triggerExpanded(page: Page) {
  // Baca via DOM (bukan role query) agar tetap terbaca saat trigger sedang
  // inert di balik drawer modal.
  return page.evaluate(() =>
    document
      .querySelector('[aria-controls="mobile-nav"]')
      ?.getAttribute("aria-expanded"),
  );
}

async function ensureInteractive(page: Page, trigger: Locator) {
  // Tunggu hidrasi React selesai (lambat di dev dingin + ada
  // hydration-regen akibat mismatch pra-eksisting FlashSaleTimer),
  // lalu klik asli berulang sampai drawer terbuka. Visibilitas dialog
  // yang dipoll (bukan trigger) karena trigger menjadi inert + tak bisa
  // di-query saat drawer terbuka — bukti modal bekerja benar.
  await page.waitForTimeout(12_000);
  const dialog = page.getByRole("dialog", { name: "Menu navigasi" });
  for (let i = 0; i < 20; i++) {
    if (await dialog.isVisible().catch(() => false)) return;
    await trigger.click({ timeout: 5_000 }).catch(() => {});
    await page.waitForTimeout(500);
  }
  throw new Error("drawer tidak merespons klik asli setelah 20 percobaan");
}

async function openDrawer(page: Page) {
  // exact:true agar tidak cocok dengan tombol "Tutup menu" saat drawer terbuka.
  const trigger = page.getByRole("button", { name: "Menu", exact: true });
  await ensureInteractive(page, trigger);
  await expect.poll(() => triggerExpanded(page)).toBe("true");
  return {
    trigger,
    dialog: page.getByRole("dialog", { name: "Menu navigasi" }),
  };
}

test("trigger Menu dan search mobile terlihat di viewport kecil", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Menu" })).toBeVisible();
  await expect(
    page.getByRole("searchbox", { name: "Cari produk" }),
  ).toBeVisible();
  // Brand hemat ruang: tersembunyi di mobile ...
  await expect(
    page.getByRole("link", { name: "Beranda Delysa Florist" }),
  ).toBeHidden();
  // ... tetapi tetap tampil di desktop.
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(
    page.getByRole("link", { name: "Beranda Delysa Florist" }),
  ).toBeVisible();
});

test("drawer terbuka, dapat ditutup, dan fokus kembali ke trigger", async ({
  page,
}) => {
  await page.goto("/");
  const { trigger, dialog } = await openDrawer(page);
  await expect(dialog).toBeVisible();
  // Link navigasi + kontak ada di dalam drawer.
  await expect(
    dialog.getByRole("link", { name: "Promo Spesial" }),
  ).toBeVisible();

  // Tutup via Escape → fokus kembali ke trigger.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  // Klik asli (pointer) setelah interaktif terbukti → drawer terbuka lagi.
  // Trigger tak bisa di-query saat drawer terbuka (inert), jadi status
  // dibaca via DOM.
  await trigger.click();
  await expect(dialog).toBeVisible();
  await expect.poll(() => triggerExpanded(page)).toBe("true");
});

test("tap link di drawer pindah route dan menutup drawer", async ({ page }) => {
  await page.goto("/");
  const { dialog } = await openDrawer(page);

  await dialog.getByRole("link", { name: "Promo Spesial" }).click();
  await expect(page).toHaveURL(/\/promo/);
  await expect(dialog).toBeHidden();
});

test("submit search mobile navigasi ke katalog terfilter", async ({ page }) => {
  await page.goto("/");
  // Pastikan React sudah interaktif sebelum mengisi form terkontrol.
  const { trigger, dialog } = await openDrawer(page);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await page
    .getByRole("searchbox", { name: "Cari produk" })
    .fill("buket wisuda");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/katalog\?.*search=buket/);
});

test("target sentuh link drawer minimal 44px dan drawer tak tambah h-scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  // Baseline: homepage 320px SUDAH overflow ±7px karena slide carousel hero
  // di luar viewport (pra-eksisting, di luar scope). AC drawer: tidak
  // MENAMBAH overflow baru — sheet fixed + animasi transform.
  const scrollWidth = () =>
    page.evaluate(() => document.documentElement.scrollWidth);
  const before = await scrollWidth();
  const { dialog } = await openDrawer(page);

  for (const name of ["Home", "Promo Spesial", "About"]) {
    const box = await dialog.getByRole("link", { name }).boundingBox();
    expect(box, `target sentuh ${name}`).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }

  expect(await scrollWidth()).toBe(before);
  // Lebar sheet drawer terkunci: 85vw, maksimal 20rem.
  const sheetWidth = await dialog.boundingBox().then((b) => b?.width ?? 0);
  expect(sheetWidth).toBeLessThanOrEqual(320);
});

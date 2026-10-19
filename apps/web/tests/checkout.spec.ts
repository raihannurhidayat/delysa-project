import { expect, test, type Locator, type Page } from "@playwright/test";

// Alur checkout guest 4 langkah.
// Lihat docs/superpowers/plans/2026-10-19-checkout-wizard.md Task 10.
//
// Catatan: dev server dingin + hydration-regen akibat mismatch pra-eksisting
// (FlashSaleTimer di homepage) membuat klik pertama bisa mendarat sebelum
// React interaktif. `clickUntil` mengulang klik sampai penanda (marker)
// muncul — pola sama dengan `ensureInteractive` di mobile-nav.spec.ts.

test.use({ viewport: { width: 1280, height: 800 } });
test.setTimeout(180_000);

const CART_KEY = "delysa:cart:v2";
const IDEMPOTENCY_KEY = "checkout_idempotency_key";

// Snapshot keranjang minimal (bentuk `StoredCartState`) untuk deep-link step.
const seededCart = {
  lines: [
    {
      slug: "buket-wisuda-elegant-golden-champagne",
      name: "Buket Wisuda Elegant Golden Champagne",
      image: "/images/mock/buket-wisuda.jpg",
      sizeId: "standard",
      sizeLabel: "Standard",
      wrapId: "standard",
      price: 250000,
      qty: 1,
      maxQty: 10,
      kind: "product",
    },
  ],
  saved: [],
  instructions: "",
};

async function clickUntil(
  page: Page,
  clicker: Locator,
  marker: Locator,
  attempts = 15,
) {
  for (let i = 0; i < attempts; i++) {
    if (
      await marker
        .first()
        .isVisible()
        .catch(() => false)
    )
      return;
    await clicker
      .first()
      .click({ timeout: 3_000 })
      .catch(() => {});
    await page.waitForTimeout(400);
  }
  await expect(marker.first()).toBeVisible({ timeout: 15_000 });
}

async function confirmCheckout(page: Page) {
  // Base UI Checkbox menaruh `id` di hidden input; yang bisa diklik adalah
  // span role=checkbox (input aria-hidden tidak terlihat).
  const confirmBox = page.getByRole("checkbox", {
    name: /Saya sudah memeriksa/,
  });
  await confirmBox.click();
  await expect(confirmBox).toBeChecked();
}

async function seedCart(page: Page, extra?: () => void) {
  await page.addInitScript(
    (payload: { key: string; state: unknown }) => {
      try {
        localStorage.setItem(payload.key, JSON.stringify(payload.state));
      } catch {
        // origin opaque (about:blank) — diabaikan, berjalan lagi di origin app
      }
    },
    { key: CART_KEY, state: seededCart },
  );
  if (extra) extra();
}

test("guest checkout 4 langkah sampai pesanan berhasil dibuat", async ({
  page,
}) => {
  // PDP → tambah ke keranjang (drawer mini) → halaman keranjang.
  // Nama dialog dibaca dari DrawerTitle (`aria-labelledby`), bukan aria-label.
  await page.goto("/products/the-grand-monolith-peach-ivory");
  const drawer = page.getByRole("dialog", { name: "Berhasil Ditambahkan" });
  await clickUntil(
    page,
    page.getByRole("button", { name: /Tambah ke Keranjang/ }),
    drawer,
  );

  await drawer.getByRole("link", { name: /Lihat Keranjang/ }).click();
  await expect(
    page.getByRole("heading", { name: "Keranjang Belanja" }),
  ).toBeVisible();

  // Langkah 1: Review.
  const reviewHeading = page.getByRole("heading", { name: "Review Keranjang" });
  await clickUntil(
    page,
    page.getByRole("link", { name: /Lanjut ke Pembayaran/ }),
    reviewHeading,
  );

  // Langkah 2: Alamat.
  const alamatHeading = page.getByRole("heading", {
    name: "Alamat Pengiriman",
  });
  await clickUntil(
    page,
    page.getByRole("button", { name: "Lanjut ke Alamat" }),
    alamatHeading,
  );
  await page.fill("#recipientName", "Budi Santoso");
  await page.fill("#recipientPhone", "081234567890");
  await page.fill(
    "#shippingAddress",
    "Jl. Pancasila No. 123, Kel. Cihideung, Tasikmalaya",
  );

  // Langkah 3: Metode bayar + unggah bukti transfer.
  const bayarHeading = page.getByRole("heading", {
    name: "Metode Pembayaran",
  });
  await clickUntil(
    page,
    page.getByRole("button", { name: "Lanjut ke Pembayaran" }),
    bayarHeading,
  );
  await page.setInputFiles(
    'input[type="file"]',
    "tests/fixtures/bukti-transfer.png",
  );
  await expect(page.getByText("bukti-transfer.png")).toBeVisible();

  // Langkah 4: Ringkasan + submit.
  const ringkasanHeading = page.getByRole("heading", {
    name: "Ringkasan & Bayar",
  });
  await clickUntil(
    page,
    page.getByRole("button", { name: "Lanjut ke Ringkasan" }),
    ringkasanHeading,
  );
  await confirmCheckout(page);

  const successHeading = page.getByRole("heading", {
    name: "Pesanan Berhasil Dibuat",
  });
  await clickUntil(
    page,
    page.getByRole("button", { name: "Buat Pesanan" }),
    successHeading,
  );
  await expect(page.getByText(/DLF-\d{8}-/)).toBeVisible();
});

test("keranjang kosong: empty state inline di /checkout tanpa redirect", async ({
  page,
}) => {
  await page.goto("/checkout");
  await expect(
    page.getByRole("heading", { name: "Keranjang kosong" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Jelajahi Katalog" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/checkout/);
});

test("deep-link step dan stepper hanya bisa mundur ke langkah selesai", async ({
  page,
}) => {
  await seedCart(page);

  await page.goto("/checkout?step=alamat");
  await expect(
    page.getByRole("heading", { name: "Alamat Pengiriman" }),
  ).toBeVisible();

  // Langkah yang belum dilalui terkunci (aria-disabled).
  await expect(
    page.getByRole("button", { name: "Langkah 3: Metode Pembayaran" }),
  ).toHaveAttribute("aria-disabled", "true");

  // Mundur ke langkah selesai lewat stepper → URL ikut berubah.
  await page
    .getByRole("button", { name: "Langkah 1: Review Keranjang (selesai)" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review Keranjang" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/step=review/);
});

test("stok tidak mencukupi: alert stock + tombol Perbarui Keranjang kembali ke review", async ({
  page,
}) => {
  await seedCart(page, () => {
    void page.addInitScript((key: string) => {
      try {
        sessionStorage.setItem(key, "stock-insufficient-test");
      } catch {
        // origin opaque — diabaikan
      }
    }, IDEMPOTENCY_KEY);
  });

  await page.goto("/checkout?step=ringkasan");
  await expect(
    page.getByRole("heading", { name: "Ringkasan & Bayar" }),
  ).toBeVisible();

  await confirmCheckout(page);
  await clickUntil(
    page,
    page.getByRole("button", { name: "Buat Pesanan" }),
    page.getByText("Stok tidak mencukupi", { exact: false }).first(),
  );

  await page.getByRole("button", { name: "Perbarui Keranjang" }).click();
  await expect(page).toHaveURL(/step=review/);
  await expect(
    page.getByRole("heading", { name: "Review Keranjang" }),
  ).toBeVisible();
});

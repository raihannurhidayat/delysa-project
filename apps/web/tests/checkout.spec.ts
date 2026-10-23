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
const GUEST_TOKEN = "e2e-checkout-guest";
const CHECKOUT_DRAFT_KEY = `checkout_draft_${GUEST_TOKEN}`;

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

async function openReadyCheckout(
  page: Page,
  paymentMethod: "manual_transfer_bca" | "qris",
) {
  await seedCart(page);
  await page.addInitScript(
    (payload: {
      guestToken: string;
      draftKey: string;
      paymentMethod: string;
    }) => {
      try {
        localStorage.setItem("guest_token", payload.guestToken);
        localStorage.setItem(
          payload.draftKey,
          JSON.stringify({
            step: "ringkasan",
            recipientName: "Budi Santoso",
            recipientPhone: "081234567890",
            shippingAddress:
              "Jl. Pancasila No. 123, Kel. Cihideung, Tasikmalaya",
            customNote: "",
            paymentMethod: payload.paymentMethod,
            confirmed: false,
            guestToken: payload.guestToken,
            updatedAt: Date.now(),
          }),
        );
      } catch {
        // origin opaque (about:blank) — diabaikan, berjalan lagi di origin app
      }
    },
    {
      guestToken: GUEST_TOKEN,
      draftKey: CHECKOUT_DRAFT_KEY,
      paymentMethod,
    },
  );

  await page.goto("/checkout?step=ringkasan");
  await expect(
    page.getByRole("heading", { name: "Ringkasan & Bayar" }),
  ).toBeVisible();
  await expect(page.getByText("Budi Santoso")).toBeVisible();
  await confirmCheckout(page);

  await clickUntil(
    page,
    page.getByRole("button", { name: "Buat Pesanan" }),
    page.getByTestId("checkout-success"),
  );
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

  // Langkah 3: pilih metode bayar, instruksi muncul, tanpa upload bukti.
  const bayarHeading = page.getByRole("heading", {
    name: "Metode Pembayaran",
  });
  await clickUntil(
    page,
    page.getByRole("button", { name: "Lanjut ke Pembayaran" }),
    bayarHeading,
  );
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.getByText("Langkah pembayaran")).toHaveCount(0);
  await page.click("#payment-method");
  await expect(page.getByRole("listbox")).toBeVisible();
  const triggerBox = await page.locator("#payment-method").boundingBox();
  const popupBox = await page.getByRole("listbox").boundingBox();
  expect(triggerBox).not.toBeNull();
  expect(popupBox).not.toBeNull();
  expect(popupBox!.y).toBeGreaterThanOrEqual(
    triggerBox!.y + triggerBox!.height + 7,
  );
  await page.getByRole("option", { name: "Transfer Manual BCA" }).click();
  const instructions = page.getByTestId("payment-instructions");
  await expect(instructions.getByText("054-082-9912")).toBeVisible();
  await expect(instructions.getByText("a.n. Kartinah")).toBeVisible();
  await expect(instructions.getByText("Langkah pembayaran")).toBeVisible();
  await expect(
    instructions.getByRole("link", {
      name: "Konfirmasi Transfer via WhatsApp",
    }),
  ).toHaveCount(0);
  await expect(page.locator('input[type="file"]')).toHaveCount(0);

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
  await expect(page.getByTestId("checkout-success")).toBeVisible();
  await expect(page.getByTestId("checkout-success-card")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  const successBody = page.getByTestId("checkout-success-body");
  await expect(successBody).toHaveCSS("display", "flex");
  await expect(successBody).toHaveCSS("flex-direction", "column");
  await expect(page.getByTestId("order-code")).toHaveText(/^DLF-\d{8}-/);
  await expect(page.getByTestId("order-status")).toHaveText(
    "Menunggu Pembayaran",
  );
  const successInstructions = page.getByTestId("payment-instructions-success");
  await expect(successInstructions).toContainText("Transfer Manual BCA");
  await expect(successInstructions).toContainText("054-082-9912");
  await expect(successInstructions).toContainText("a.n. Kartinah");
  await expect(
    page.getByRole("button", { name: "Salin kode pesanan" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Salin nomor rekening" }),
  ).toBeVisible();
  await expect(page.getByTestId("payment-proof-input")).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Konfirmasi via WhatsApp" }),
  ).toBeVisible();

  await page.setInputFiles(
    '[data-testid="payment-proof-input"]',
    "tests/fixtures/bukti-transfer.png",
  );
  await expect(page.getByText("bukti-transfer.png")).toBeVisible();
  await page.getByRole("button", { name: "Kirim bukti pembayaran" }).click();
  await expect(page.getByTestId("order-status")).toHaveText(
    "Menunggu Verifikasi",
  );
  await expect(page.getByTestId("upload-success")).toContainText(
    "Bukti pembayaran diterima",
  );
  await expect(page.getByTestId("upload-success")).toContainText(
    "bukti-transfer.png",
  );
  await expect(
    page.getByRole("button", { name: "Kirim bukti pembayaran" }),
  ).toHaveCount(0);
});

test("success card memakai proporsi ringkas di desktop dan mobile", async ({
  page,
}) => {
  await openReadyCheckout(page, "manual_transfer_bca");

  const success = page.getByTestId("checkout-success");
  const heading = page.getByRole("heading", {
    name: "Pesanan Berhasil Dibuat",
  });
  const whatsapp = page.getByRole("link", {
    name: "Konfirmasi via WhatsApp",
  });

  await expect(success).toHaveCSS("max-width", "768px");
  await expect(heading).toHaveCSS("font-size", "20px");
  await expect(whatsapp).toHaveCSS("height", "40px");

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(heading).toHaveCSS("font-size", "18px");
  await expect(whatsapp).toHaveCSS("height", "40px");
});

test("success card QRIS menampilkan instruksi QRIS, bukan rekening BCA", async ({
  page,
}) => {
  await openReadyCheckout(page, "qris");

  const instructions = page.getByTestId("payment-instructions-success");
  await expect(instructions).toContainText("QRIS");
  await expect(instructions).toContainText(
    "Minta QR code QRIS kepada admin melalui WhatsApp.",
  );
  await expect(instructions).toContainText("QR code dikirim via WhatsApp");
  await expect(instructions).not.toContainText("Rekening BCA");
  await expect(instructions).not.toContainText("054-082-9912");
  await expect(
    page.getByRole("link", { name: "Minta QRIS via WhatsApp" }),
  ).toBeVisible();
});

test("metode bayar QRIS: instruksi muncul setelah dipilih, tanpa upload", async ({
  page,
}) => {
  await seedCart(page);
  await page.goto("/checkout?step=bayar");
  await expect(
    page.getByRole("heading", { name: "Metode Pembayaran" }),
  ).toBeVisible();

  await expect(page.getByText("Langkah pembayaran")).toHaveCount(0);
  await page.getByRole("button", { name: "Lanjut ke Ringkasan" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Pilih metode pembayaran" }),
  ).toBeVisible();

  await page.click("#payment-method");
  await page.getByRole("option", { name: "QRIS" }).click();
  const instructions = page.getByTestId("payment-instructions");
  await expect(
    instructions.getByText("Minta QR code QRIS kepada admin melalui WhatsApp."),
  ).toBeVisible();
  await expect(instructions.getByText("Minta QRIS via WhatsApp")).toBeVisible();
  await expect(instructions.getByText("Rekening BCA")).toHaveCount(0);
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
});

test("select tidak mengunci scroll halaman dan sudut item lebih rapi", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await seedCart(page);
  await page.goto("/checkout?step=bayar");
  await expect(
    page.getByRole("heading", { name: "Metode Pembayaran" }),
  ).toBeVisible();

  await page.click("#payment-method");
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();

  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.move(640, 100);
  await page.mouse.wheel(0, 500);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(before);
  await expect(listbox).toBeVisible();

  await expect(page.locator('[data-slot="select-content"]')).toHaveCSS(
    "border-radius",
    "10px",
  );
  await expect(
    page.getByRole("option", { name: "Transfer Manual BCA" }),
  ).toHaveCSS("border-radius", "8px");
});

test("alamat tetap terang saat OS memakai dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await seedCart(page);
  await page.goto("/checkout?step=alamat");
  await expect(
    page.getByRole("heading", { name: "Alamat Pengiriman" }),
  ).toBeVisible();

  for (const id of ["recipientName", "shippingAddress"]) {
    const field = page.locator(`#${id}`);
    await expect(field).toHaveCSS("color-scheme", "light");
    await expect(field).toHaveCSS("background-color", "rgb(255, 255, 255)");
  }
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

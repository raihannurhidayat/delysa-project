# Status & Riwayat Pesanan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan halaman publik `/status-pesanan/$kodePesanan` dan halaman user `/riwayat-pesanan` yang membaca order dari store lokal, menampilkan timeline 8 status, memungkinkan upload bukti pembayaran, dan menyimpan order baru dari checkout tanpa mengubah backend.

**Architecture:** Order domain baru di `features/shop` memakai pola `useSyncExternalStore` yang sudah terbukti pada mini-cart: `order-storage` (localStorage + seed), `order-store-internal` (single source of truth), `order-store` (public API), dan hook tipis `use-orders`/`use-order`. Route file hanya membaca params/search dan meneruskan ke view. View presentational memakai komponen order reusable. Checkout memanggil `saveOrder` setelah `createOrder` sukses; uploader bukti diekstrak dari `CheckoutSuccess` agar dipakai bersama.

**Tech Stack:** TanStack Start 1.168 + Router 1.170.41, React 19, TypeScript, Tailwind v4, Base UI, Zod 3.23.8, Vitest 5 + Testing Library, Playwright tersedia tetapi tidak dipakai untuk task ini.

**Spec:**
- `docs/research/status-pesanan.md`
- `docs/prd/PRD-Delysa-Florist.md` (status pesanan, riwayat, pembayaran manual)
- `docs/prd/PRD-Frontend-Delysa-Florist.md` (FE-3 checkout, halaman akun)
- `packages/shared/src/constants.ts` (`ORDER_STATUSES`)
- `apps/web/src/features/checkout/api/endpoints.ts` (`OrderResponse`, `createOrder`, `uploadPaymentProof`)

---

## Global Constraints

- **Tanpa perubahan backend/kontrak:** tidak menambah endpoint, tidak mengubah `packages/shared/openapi.yaml`, tidak mengubah `packages/shared/src/constants.ts`. `GET /orders` belum ada; data order adalah demo client-only.
- **Tanpa dependency baru:** gunakan React, TanStack Router, Zod, Lucide, dan UI primitives yang sudah ada.
- **Route tipis:** file di `apps/web/src/routes/_shop/` hanya `createFileRoute`, `validateSearch`, `head`, dan komponen wrapper yang membaca params/search. Jangan menaruh state atau markup besar di route.
- **Jangan edit `apps/web/src/routes/routeTree.gen.ts`:** file digenerate oleh build.
- **PII:** tamu melihat nama/telepon/alamat yang dimask; hanya mode `customer` demo yang melihat data penuh. Kode pesanan adalah kapabilitas publik untuk demo.
- **Status:** gunakan 8 status dari `ORDER_STATUSES`; jangan menambah status baru. Timeline utama hanya 6 tahap; `cancelled`/`rejected` adalah terminal.
- **Pembayaran:** order menyimpan snapshot `OrderPaymentSnapshot`; jangan import `features/checkout/payment-methods` dari komponen order. Hanya `buildOrderRecord` di checkout yang membuat snapshot.
- **Store:** semua mutasi lewat `order-store.ts`; komponen tidak menulis localStorage langsung.
- **SSR:** `getServerSnapshot` mengembalikan `{ orders: [] }` yang stabil. View menunggu `mounted` sebelum menampilkan data localStorage.
- **TDD:** setiap task menulis test yang gagal lebih dulu, lalu implementasi minimal, lalu test hijau.
- **Gaya kode:** ikuti repo: double quotes, semicolons, `cn` dari `"cn"`, Tailwind arbitrary colors (`#FF6B35`, `#111111`, `#E5E7EB`), komponen function export.
- **Verifikasi akhir:**
  - `pnpm --filter client-web-delysa-florist test`
  - `pnpm --filter client-web-delysa-florist build`
  - `pnpm --filter client-web-delysa-florist format:check`
  - `pnpm lint`

---

## Review Focus

| # | Input / Failure Mode | Expected Behavior | Test Location |
|---|---|---|---|
| 1 | Tamu membuka `/riwayat-pesanan` | State terkunci + CTA login demo + form lacak kode; tidak redirect | Task 12 view test |
| 2 | Tamu membuka `/status-pesanan/DLF-...` | Status, timeline, item, dan pembayaran tampil; nama/telepon/alamat dimask | Task 10 view test |
| 3 | User mengaktifkan login demo lalu membuka riwayat | 14 order dalam 30 hari tampil; PII penuh di status page | Task 4 + Task 12 tests |
| 4 | Checkout berhasil lalu refresh | Order baru ada di riwayat dan status page; data bertahan setelah refresh | Task 8 + Task 3 tests |
| 5 | Upload bukti dari status page | Status menjadi `pending_verification`, timeline bertambah, badge riwayat ikut berubah | Task 7 + Task 9 tests |
| 6 | localStorage rusak atau kode tidak dikenal | Store jatuh ke seed saat storage rusak; kode tidak dikenal menampilkan not-found + lookup, tanpa crash | Task 2 + Task 10 tests |

---

## File Placement Map

| File | Action | Purpose |
|---|---|---|
| `apps/web/src/features/shop/types.ts` | Modify | Tambah `OrderRecord`, `OrderPaymentSnapshot`, `OrderTimelineEvent`, tipe filter |
| `apps/web/src/features/shop/lib/order-status.ts` | Create | Metadata 8 status, `ORDER_FLOW`, helper terminal |
| `apps/web/src/features/shop/lib/order-format.ts` | Create | Format tanggal WIB |
| `apps/web/src/features/shop/lib/order-privacy.ts` | Create | Mask nama, telepon, alamat |
| `apps/web/src/features/shop/data/orders.ts` | Create | Seed 16 order demo relatif terhadap `now` |
| `apps/web/src/features/shop/lib/order-storage.ts` | Create | Baca/tulis/validasi localStorage |
| `apps/web/src/features/shop/lib/order-store-internal.ts` | Create | Store singleton, hydrate, mutasi |
| `apps/web/src/features/shop/lib/order-store.ts` | Create | Public API store + lookup helper |
| `apps/web/src/features/shop/hooks/use-orders.ts` | Create | `useOrders`, `useOrder` |
| `apps/web/src/features/shop/lib/demo-auth-store.ts` | Create | Mode `guest|customer` + persist |
| `apps/web/src/features/shop/hooks/use-demo-auth.ts` | Create | Hook mode demo |
| `apps/web/src/features/shop/components/orders/demo-auth-switch.tsx` | Create | Switch DEV-only |
| `apps/web/src/features/shop/lib/order-filters.ts` | Create | Filter, tab count, sort, pagination |
| `apps/web/src/features/shop/schemas/order-history-search-schema.ts` | Create | Zod search params riwayat |
| `apps/web/src/features/shop/lib/clipboard.ts` | Create | Copy + toast helper |
| `apps/web/src/features/shop/components/orders/order-status-badge.tsx` | Create | Badge status |
| `apps/web/src/features/shop/components/orders/order-status-timeline.tsx` | Create | Timeline 6 tahap + terminal |
| `apps/web/src/features/shop/components/orders/copy-order-code-button.tsx` | Create | Tombol salin kode |
| `apps/web/src/features/shop/components/orders/payment-proof-uploader.tsx` | Create | Uploader reusable |
| `apps/web/src/features/shop/components/orders/order-status-summary.tsx` | Create | Header status + timeline |
| `apps/web/src/features/shop/components/orders/order-payment-card.tsx` | Create | Pembayaran, countdown, uploader |
| `apps/web/src/features/shop/components/orders/order-items-card.tsx` | Create | Item + totals |
| `apps/web/src/features/shop/components/orders/order-delivery-card.tsx` | Create | Penerima + alamat + kurir |
| `apps/web/src/features/shop/components/orders/order-code-lookup-form.tsx` | Create | Form lacak kode |
| `apps/web/src/features/shop/components/orders/order-not-found.tsx` | Create | State kode tidak ditemukan |
| `apps/web/src/features/shop/components/orders/order-history-header.tsx` | Create | Heading + concierge |
| `apps/web/src/features/shop/components/orders/order-history-toolbar.tsx` | Create | Search, periode, sort |
| `apps/web/src/features/shop/components/orders/order-history-tabs.tsx` | Create | Pill tab status + count |
| `apps/web/src/features/shop/components/orders/order-history-card.tsx` | Create | Kartu pesanan |
| `apps/web/src/features/shop/components/orders/order-history-empty.tsx` | Create | Empty state |
| `apps/web/src/features/shop/components/orders/order-history-locked.tsx` | Create | State tamu |
| `apps/web/src/features/shop/view/order-status-page.tsx` | Create | View status |
| `apps/web/src/features/shop/view/order-history-page.tsx` | Create | View riwayat |
| `apps/web/src/routes/_shop/status-pesanan.$kodePesanan.tsx` | Create | Route status |
| `apps/web/src/routes/_shop/riwayat-pesanan.tsx` | Create | Route riwayat |
| `apps/web/src/routes/_shop/route.tsx` | Modify | Mount `DemoAuthSwitch` |
| `apps/web/src/features/shop/components/storefront/shop-header.tsx` | Modify | Nav "Pesanan Saya" + link akun |
| `apps/web/src/features/shop/components/storefront/shop-mobile-nav.tsx` | Modify | Link "Pesanan saya" |
| `apps/web/src/features/shop/components/storefront/trust-strip.tsx` | Modify | Optional `items` |
| `apps/web/src/features/shop/components/catalog/catalog-pagination.tsx` | Modify | Optional `itemLabel`/`ariaLabel` |
| `apps/web/src/features/checkout/components/CheckoutSuccess.tsx` | Modify | Pakai uploader + link status |
| `apps/web/src/features/checkout/hooks/use-checkout.ts` | Modify | Simpan order setelah create |
| `apps/web/src/features/checkout/lib/order-record.ts` | Create | Mapper checkout → `OrderRecord` |

---

## Reuse Decision Table

| Kebutuhan | Keputusan | Aset/Path | Alasan |
|---|---|---|---|
| Store + localStorage + SSR snapshot | **Reuse pola** | `features/shop/lib/mini-cart-store-internal.ts`, `mini-cart-storage.ts` | Pola sudah teruji, konsisten |
| Totals | **Reuse** | `features/shop/lib/cart-totals.ts` | Satu sumber perhitungan |
| Format rupiah | **Reuse** | `features/shop/lib/format.ts` | Format konsisten |
| Pagination | **Extend** | `features/shop/components/catalog/catalog-pagination.tsx` | Tambah label generik |
| Trust strip | **Extend** | `features/shop/components/storefront/trust-strip.tsx` | Tambah item opsional |
| Uploader bukti | **Extract + reuse** | `CheckoutSuccess.tsx` | Hindari duplikasi 300+ baris |
| Label status | **Extract** | `CheckoutSuccess.tsx:39` → `order-status.ts` | Satu sumber label |
| UI primitives | **Reuse** | `components/ui/*` | Button, Badge, Input, Select, Alert, Breadcrumb |
| Tabs | **Create lokal** | `order-history-tabs.tsx` | `components/ui/tabs.tsx` bergaya underline, bukan pill |
| Icons | **Reuse** | `lucide-react` | Konsisten |

---

## Task Breakdown

### Task 1: Order Domain Types, Status Metadata, Formatting, Privacy

**Files:**
- Modify: `apps/web/src/features/shop/types.ts`
- Create: `apps/web/src/features/shop/lib/order-status.ts`
- Create: `apps/web/src/features/shop/lib/order-format.ts`
- Create: `apps/web/src/features/shop/lib/order-privacy.ts`
- Test: `apps/web/src/features/shop/lib/order-status.test.ts`
- Test: `apps/web/src/features/shop/lib/order-format.test.ts`
- Test: `apps/web/src/features/shop/lib/order-privacy.test.ts`

**Interfaces:**
- Consumes: `OrderStatus` dari `@delysa/shared`, `MiniCartLine` dan `CartTotals`.
- Produces:
  - `OrderPaymentMethod = "manual_transfer_bca" | "qris"`
  - `OrderPaymentSnapshot`
  - `OrderTimelineEvent`
  - `OrderRecord`
  - `OrderPeriod`, `OrderSort`, `OrderTab`
  - `ORDER_FLOW`, `ORDER_STATUS_META`, `getOrderStatusMeta`, `isClosedOrderStatus`
  - `formatOrderDate`, `formatOrderShortDate`
  - `maskOrderName`, `maskOrderPhone`, `maskOrderAddress`

- [ ] **Step 1: Write failing tests**

`order-status.test.ts`:
- Setiap status di `ORDER_STATUSES` punya `label`, `shortLabel`, `description`, dan `tone` non-empty.
- `ORDER_FLOW` berisi tepat 6 status berurutan: `pending_payment`, `pending_verification`, `paid`, `processing`, `shipped`, `delivered`.
- `isClosedOrderStatus("cancelled")` dan `("rejected")` true; status lain false.
- `getOrderStatusMeta("pending_payment").stepIndex` 0; `("delivered").stepIndex` 5; `("cancelled").stepIndex` null.

`order-format.test.ts`:
- `formatOrderDate("2026-10-24T02:15:00.000Z")` → `"24 Okt 2026, 09:15 WIB"`.
- `formatOrderShortDate("2026-10-24T02:15:00.000Z")` → `"24 Okt 2026"`.
- Input invalid/kosong → `"Tanggal tidak tersedia"`.

`order-privacy.test.ts`:
- `maskOrderName("dr. Amelia")` → `"dr. A***"`.
- `maskOrderName("Sari")` → `"S***"`.
- `maskOrderPhone("082116789558")` → `"0821****558"`.
- `maskOrderPhone("123")` → `"****"`.
- `maskOrderAddress("Jl. Sutisna Senjaya No. 12, Tasikmalaya")` → `"Tasikmalaya, alamat lengkap disembunyikan"`.
- `maskOrderAddress("")` → `"Alamat disembunyikan"`.

- [ ] **Step 2: Run tests to verify they fail**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/lib/order-status.test.ts src/features/shop/lib/order-format.test.ts src/features/shop/lib/order-privacy.test.ts
```

- [ ] **Step 3: Implement types and helpers**

Tambahkan di akhir `types.ts`:

```ts
export type OrderPaymentMethod = "manual_transfer_bca" | "qris";

export type OrderPaymentSnapshot = {
  methodId: OrderPaymentMethod | "";
  label: string;
  description: string;
  bank?: { name: string; accountNumber: string; accountName: string };
  steps: readonly string[];
};

export type OrderTimelineEvent = {
  status: OrderStatus;
  at: string;
  note?: string;
};

export type OrderRecord = {
  id: number;
  code: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  paymentDeadline: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  customNote?: string;
  items: MiniCartLine[];
  totals: CartTotals;
  payment: OrderPaymentSnapshot;
  timeline: OrderTimelineEvent[];
  courier?: string;
  trackingNumber?: string;
  deliveredAt?: string;
};

export type OrderPeriod = "30d" | "90d" | "1y" | "all";
export type OrderSort = "newest" | "oldest" | "total_desc";
export type OrderTab =
  | "all"
  | "pending_payment"
  | "pending_verification"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "closed";
```

Tambahkan import type di atas `types.ts`:

```ts
import type { OrderStatus } from "@delysa/shared";
import type { CartTotals } from "~/features/shop/lib/cart-totals";
```

`order-status.ts` memakai mapping berikut:

| Status | Label | Short | Tone | stepIndex |
|---|---|---|---|---|
| `pending_payment` | Menunggu Pembayaran | Belum Bayar | warning | 0 |
| `pending_verification` | Menunggu Verifikasi | Verifikasi | info | 1 |
| `paid` | Pembayaran Terverifikasi | Dibayar | success | 2 |
| `processing` | Diproses | Diproses | progress | 3 |
| `shipped` | Dikirim | Dikirim | progress | 4 |
| `delivered` | Selesai | Selesai | success | 5 |
| `cancelled` | Dibatalkan | Batal | danger | null |
| `rejected` | Ditolak | Ditolak | danger | null |

`order-format.ts`:
- Format tanggal: `new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric" })`.
- Format jam: `new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false })`; ganti `.` menjadi `:`.
- Gabungkan `${tanggal}, ${jam} WIB`.
- Guard `Number.isNaN(Date.parse(iso))`.

`order-privacy.ts`:
- Nama: trim; jika kosong `"Pelanggan"`; jika ada spasi, `${kataPertama} ${hurufPertamaKataTerakhir}***`; jika satu kata, `${hurufPertama}***`.
- Telepon: ambil digit; jika `<= 6` return `"****"`; else `${4 digit awal}****${3 digit akhir}`.
- Alamat: split `,`, ambil segmen terakhir; jika kosong `"Alamat disembunyikan"`; else `${area}, alamat lengkap disembunyikan`.

- [ ] **Step 4: Run tests to verify they pass**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/lib/order-status.test.ts src/features/shop/lib/order-format.test.ts src/features/shop/lib/order-privacy.test.ts
```

- [ ] **Step 5: Format changed files**

```powershell
pnpm --filter client-web-delysa-florist exec prettier --write src/features/shop/types.ts src/features/shop/lib/order-status.ts src/features/shop/lib/order-format.ts src/features/shop/lib/order-privacy.ts src/features/shop/lib/order-status.test.ts src/features/shop/lib/order-format.test.ts src/features/shop/lib/order-privacy.test.ts
```

---

### Task 2: Seed Orders + localStorage Storage

**Files:**
- Create: `apps/web/src/features/shop/data/orders.ts`
- Create: `apps/web/src/features/shop/lib/order-storage.ts`
- Test: `apps/web/src/features/shop/lib/order-storage.test.ts`

**Interfaces:**
- Consumes: `OrderRecord`, `OrderStatus`, `computeCartTotals`, `MiniCartLine`.
- Produces:
  - `createDemoOrders(now?: Date): OrderRecord[]`
  - `ORDER_STORAGE_KEY = "delysa:orders:v1"`
  - `OrderState = { orders: OrderRecord[] }`
  - `loadOrderState(): OrderState | null`
  - `saveOrderState(state: OrderState): void`
  - `isOrderRecord(value: unknown): value is OrderRecord`

- [ ] **Step 1: Write failing tests**

`order-storage.test.ts`:
- `beforeEach(() => localStorage.clear())`.
- `createDemoOrders(new Date("2026-10-24T12:00:00.000Z"))` menghasilkan 16 order.
- Tepat 14 order berada dalam 30 hari terakhir dari `now`.
- Semua 8 status muncul; kode unik dan cocok `/^DLF-\d{8}-[A-Z0-9]{4}$/`.
- `timeline` tidak kosong dan event terakhir selalu sama dengan `order.status`.
- `pending_payment` punya `paymentDeadline` = `createdAt + 24 jam`.
- `delivered` punya `deliveredAt`; `shipped`/`delivered` punya `courier` dan `trackingNumber`.
- `totals.grandTotal` sama dengan `computeCartTotals(order.items, null).grandTotal` untuk order tanpa kupon; order dengan kupon memakai kupon yang sama.
- `loadOrderState()` null saat key tidak ada; null saat JSON rusak; menyaring record tidak valid.
- `saveOrderState` lalu `loadOrderState` mengembalikan data yang sama.
- `isOrderRecord` menolak object tanpa `code`, status tidak dikenal, dan `items` bukan array.

- [ ] **Step 2: Run test to verify it fails**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/lib/order-storage.test.ts
```

- [ ] **Step 3: Implement seed and storage**

`data/orders.ts`:
- Definisikan 6 snapshot item dari `apps/web/src/mock/products/catalog.json`:

| # | Slug | Name | Price | Image |
|---:|---|---|---:|---|
| 1 | `single-sunflower-mentari-wisuda` | Single Sunflower 'Mentari Wisuda' | 45000 | `https://images.unsplash.com/photo-1463320726281-696a485928c7?w=800&q=80&auto=format&fit=crop` |
| 2 | `buket-wisuda-mini-teddy-scholar` | Buket Boneka Wisuda Mini Teddy 'Scholar' | 85000 | `https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&q=80&auto=format&fit=crop` |
| 3 | `buket-wisuda-elegant-golden-champagne` | Buket Wisuda Elegant 'Golden Champagne' | 195000 | `https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&q=80&auto=format&fit=crop` |
| 4 | `buket-wisuda-sapphire-sky-edition` | Buket Wisuda Sapphire Sky Edition | 240000 | `https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=800&q=80&auto=format&fit=crop` |
| 5 | `buket-mawar-single-satin-aura` | Buket Mawar Single Satin 'Aura' | 55000 | `https://images.unsplash.com/photo-1533616688419-b7a585564566?w=800&q=80&auto=format&fit=crop` |
| 6 | `buket-mawar-velvet-passion-15-tangkai` | Buket Mawar 'Velvet Passion' 15 Tangkai | 320000 | `https://images.unsplash.com/photo-1520763185298-1b434c919102?w=800&q=80&auto=format&fit=crop` |

- Gunakan `sizeId: "standard"`, `sizeLabel: "Standard"`, `wrapId: "signature"`, `wrapLabel: "Signature Wrap"`; untuk item premium gunakan `sizeId: "premium"`, `sizeLabel: "Premium"`, `wrapId: "premium"`, `wrapLabel: "Premium Wrap"`.
- Helper `demoPayment(methodId)` menghasilkan snapshot BCA/QRIS yang sama dengan `payment-methods.ts` (BCA `054-082-9912` a.n. `Kartinah`; QRIS tanpa bank).
- Helper `timelineFor(status, createdAt)` membuat event berurutan; untuk `cancelled`/`rejected` hanya event awal + event terminal dengan note `"Dibatalkan oleh admin"` / `"Pembayaran ditolak"`.
- Helper `makeOrder({ suffix, daysAgo, status, itemIndexes, method, recipient, phone, address, note, courier, tracking })`; untuk `shipped`/`delivered` isi `courier: "JNE"` dan `trackingNumber: \`JNE-${suffix}-${createdAt.slice(0, 10).replace(/-/g, "")}\``.
- Roster penerima dan alamat:

| # | Recipient | Phone | Address | Note |
|---:|---|---|---|---|
| 1 | Sari Amelia | 082116789558 | Jl. Sutisna Senjaya No. 12, Tasikmalaya | Kirim sore hari |
| 2 | Budi Santoso | 081234567890 | Jl. Pancasila No. 45, Tasikmalaya |  |
| 3 | Rina Kartika | 085712345678 | Jl. Cihideung No. 8, Tasikmalaya |  |
| 4 | Dewi Lestari | 081398765432 | Jl. Siliwangi No. 21, Tasikmalaya | Titip ke resepsionis |
| 5 | Fajar Nugraha | 082198765432 | Jl. BKR No. 77, Tasikmalaya |  |
| 6 | Intan Permata | 081377788899 | Jl. Pahlawan No. 3, Tasikmalaya |  |
| 7 | Agus Setiawan | 085223344556 | Jl. Empang No. 19, Tasikmalaya |  |
| 8 | Nabila Putri | 081566677788 | Jl. Nagarawangi No. 5, Tasikmalaya |  |
| 9 | Hendra Wijaya | 082133344455 | Jl. Mangunsarkoro No. 14, Tasikmalaya |  |
| 10 | Lestari Ningsih | 081911122233 | Jl. Paseh No. 2, Tasikmalaya |  |
| 11 | Yoga Pratama | 085744455566 | Jl. Cilembang No. 31, Tasikmalaya |  |
| 12 | Maya Sari | 081255566677 | Jl. Sutisna Senjaya No. 88, Tasikmalaya |  |
| 13 | Dimas Saputra | 082177788899 | Jl. Galunggung No. 6, Tasikmalaya |  |
| 14 | Anisa Rahma | 081399900011 | Jl. BKR No. 102, Tasikmalaya |  |
| 15 | Rizky Maulana | 085266677788 | Jl. Siliwangi No. 55, Tasikmalaya |  |
| 16 | Putri Anggraini | 081577788899 | Jl. Cihideung No. 27, Tasikmalaya |  |

- 16 order dengan komposisi:

| # | Hari lalu | Status | Pembayaran | Item |
|---:|---:|---|---|---|
| 1 | 0 | `pending_payment` | BCA | 2 |
| 2 | 1 | `pending_verification` | QRIS | 1 |
| 3 | 2 | `paid` | BCA | 1 |
| 4 | 4 | `processing` | BCA | 2 |
| 5 | 6 | `shipped` | BCA | 1 |
| 6 | 8 | `delivered` | BCA | 2 |
| 7 | 10 | `cancelled` | QRIS | 1 |
| 8 | 12 | `rejected` | BCA | 1 |
| 9 | 14 | `delivered` | BCA | 1 |
| 10 | 16 | `delivered` | QRIS | 2 |
| 11 | 18 | `processing` | BCA | 1 |
| 12 | 21 | `paid` | QRIS | 1 |
| 13 | 25 | `pending_verification` | BCA | 1 |
| 14 | 29 | `delivered` | BCA | 2 |
| 15 | 60 | `delivered` | BCA | 1 |
| 16 | 120 | `cancelled` | QRIS | 2 |

- Suffix unik: `8842`, `7710`, `6621`, `5530`, `4419`, `3308`, `2217`, `1106`, `9905`, `8804`, `7703`, `6602`, `5501`, `4400`, `3399`, `2288`.
- Kode: `DLF-${createdAt.slice(0, 10).replace(/-/g, "")}-${suffix}`.
- Gunakan `computeCartTotals(items, coupon)`; satu order (`#6`) memakai kupon `{ code: "DELYSAWISUDA", label: "Diskon Wisuda", amount: 20000 }`.
- `paymentDeadline` = `createdAt + 24 * 60 * 60 * 1000`.
- `updatedAt` = timestamp event terakhir; `deliveredAt` diisi untuk `delivered`.
- Return diurutkan `createdAt` descending.

`order-storage.ts`:
- `loadOrderState` return `null` saat SSR, JSON rusak, atau bukan object.
- Jika `orders` array, filter dengan `isOrderRecord`; return `{ orders: valid }` (array kosong valid, tidak memicu seed ulang).
- `saveOrderState` try/catch quota.
- `isOrderRecord` memvalidasi `id` number, `code` string, `status` termasuk `ORDER_STATUSES`, `createdAt`/`updatedAt`/`paymentDeadline` string, `items` array, `totals` object, `payment` object, `timeline` array.

- [ ] **Step 4: Run test to verify it passes**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/lib/order-storage.test.ts
```

- [ ] **Step 5: Format changed files**

```powershell
pnpm --filter client-web-delysa-florist exec prettier --write src/features/shop/data/orders.ts src/features/shop/lib/order-storage.ts src/features/shop/lib/order-storage.test.ts
```

---

### Task 3: Order Store + Hooks

**Files:**
- Create: `apps/web/src/features/shop/lib/order-store-internal.ts`
- Create: `apps/web/src/features/shop/lib/order-store.ts`
- Create: `apps/web/src/features/shop/hooks/use-orders.ts`
- Test: `apps/web/src/features/shop/lib/order-store.test.ts`
- Test: `apps/web/src/features/shop/hooks/use-orders.test.tsx`

**Interfaces:**
- Consumes: `loadOrderState`, `saveOrderState`, `createDemoOrders`, `OrderRecord`.
- Produces:
  - `EMPTY_ORDER_STATE: OrderState`
  - `getOrderSnapshot(): OrderState`
  - `getOrderServerSnapshot(): OrderState`
  - `subscribeOrders(listener: () => void): () => void`
  - `saveOrder(order: OrderRecord): void`
  - `updateOrderStatus(code: string, status: OrderStatus, event?: { note?: string; at?: string }): OrderRecord | null`
  - `normalizeOrderCode(code: string): string`
  - `findOrderByCode(orders: OrderRecord[], code: string): OrderRecord | undefined`
  - `useOrders(): OrderState`
  - `useOrder(code: string): OrderRecord | undefined`

- [ ] **Step 1: Write failing tests**

`order-store.test.ts`:
- Snapshot server selalu `{ orders: [] }`.
- Saat storage kosong, `getOrderSnapshot()` setelah window tersedia menghasilkan 16 seed dan menulis `delysa:orders:v1`.
- `saveOrder` menambah order baru di depan; order dengan kode sama tidak terduplikasi (upsert).
- `updateOrderStatus` menambah event, mengubah `updatedAt`, dan mengisi `deliveredAt` saat status `delivered`.
- `updateOrderStatus` dengan status sama tidak menambah event duplikat.
- `updateOrderStatus` kode tidak dikenal return `null`.
- `normalizeOrderCode("  dlf-20261024-8842 ")` → `"DLF-20261024-8842"`.
- `findOrderByCode` menemukan kode dengan spasi/huruf kecil.

`use-orders.test.tsx`:
- `getOrderServerSnapshot()` mengembalikan `{ orders: [] }`.
- `renderHook(() => useOrders())` menghasilkan 16 order setelah mount (gunakan `waitFor`).
- `useOrder("  dlf-20261024-8842  ")` mengembalikan order yang benar; kode tidak dikenal `undefined`.
- Setelah `saveOrder`, hook re-render dengan order baru.

Gunakan `vi.resetModules()` + `await import()` di `beforeEach` agar singleton store bersih; `localStorage.clear()`.

- [ ] **Step 2: Run tests to verify they fail**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/lib/order-store.test.ts src/features/shop/hooks/use-orders.test.tsx
```

- [ ] **Step 3: Implement store and hooks**

`order-store-internal.ts` mengikuti pola `mini-cart-store-internal.ts`:

```ts
let storeState: OrderState | null = null;
let initialized = false;
const listeners = new Set<() => void>();

export const EMPTY_ORDER_STATE: OrderState = { orders: [] };

function hydrate() {
  if (initialized) return;
  initialized = true;
  if (typeof window === "undefined") return;
  const stored = loadOrderState();
  storeState = stored ?? { orders: createDemoOrders() };
  if (!stored) saveOrderState(storeState);
}

export function getOrderServerSnapshot(): OrderState {
  return EMPTY_ORDER_STATE;
}

export function getOrderSnapshot(): OrderState {
  if (!initialized && typeof window !== "undefined") hydrate();
  return storeState ?? EMPTY_ORDER_STATE;
}
```

- `subscribeOrders` memanggil `hydrate()` di client, menambah listener, return unsubscribe.
- `saveOrder`: hydrate; normalisasi `order.code` ke uppercase; jika kode sudah ada, ganti di posisi yang sama; jika baru, `[order, ...orders]`; simpan; notify.
- `updateOrderStatus`: hydrate; cari index; jika tidak ada return `null`; jika status sama return order saat ini; buat event `{ status, at: event?.at ?? new Date().toISOString(), note: event?.note }`; update `status`, `updatedAt`, `timeline`, `deliveredAt`; simpan; notify; return updated.
- `order-store.ts` re-export fungsi internal + `normalizeOrderCode`/`findOrderByCode`.
- `use-orders.ts` memakai `useSyncExternalStore(subscribeOrders, getOrderSnapshot, getOrderServerSnapshot)`; `useOrder` memakai `useMemo` dan `normalizeOrderCode`.

- [ ] **Step 4: Run tests to verify they pass**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/lib/order-store.test.ts src/features/shop/hooks/use-orders.test.tsx
```

- [ ] **Step 5: Format changed files**

```powershell
pnpm --filter client-web-delysa-florist exec prettier --write src/features/shop/lib/order-store-internal.ts src/features/shop/lib/order-store.ts src/features/shop/hooks/use-orders.ts src/features/shop/lib/order-store.test.ts src/features/shop/hooks/use-orders.test.tsx
```

---

### Task 4: Demo Auth Store + Switch

**Files:**
- Create: `apps/web/src/features/shop/lib/demo-auth-store.ts`
- Create: `apps/web/src/features/shop/hooks/use-demo-auth.ts`
- Create: `apps/web/src/features/shop/components/orders/demo-auth-switch.tsx`
- Test: `apps/web/src/features/shop/lib/demo-auth-store.test.ts`
- Test: `apps/web/src/features/shop/components/orders/demo-auth-switch.test.tsx`

**Interfaces:**
- Produces:
  - `DemoAuthMode = "guest" | "customer"`
  - `DEMO_AUTH_STORAGE_KEY = "delysa:demo-auth:v1"`
  - `DEMO_CUSTOMER_NAME = "Sari Amelia"`
  - `getDemoAuthSnapshot(): DemoAuthMode`
  - `getDemoAuthServerSnapshot(): DemoAuthMode`
  - `subscribeDemoAuth(listener: () => void): () => void`
  - `setDemoAuthMode(mode: DemoAuthMode): void`
  - `toggleDemoAuthMode(): void`
  - `useDemoAuth(): { mode; isCustomer; setMode; toggle }`

- [ ] **Step 1: Write failing tests**

`demo-auth-store.test.ts`:
- Default `guest` saat storage kosong.
- `setDemoAuthMode("customer")` persist ke `delysa:demo-auth:v1` dan snapshot berubah.
- Nilai storage tidak valid (`"admin"`) fallback `guest`.
- `toggleDemoAuthMode()` berganti dua arah.
- `getDemoAuthServerSnapshot()` selalu `guest`.

`demo-auth-switch.test.tsx`:
- Render switch; dua tombol "Anonim" dan "Login demo".
- Klik "Login demo" → `aria-pressed` true, localStorage berisi `customer`.
- Klik "Anonim" → kembali guest.
- `role="group"` dan `aria-label="Mode demo akun"` ada.

- [ ] **Step 2: Run tests to verify they fail**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/lib/demo-auth-store.test.ts src/features/shop/components/orders/demo-auth-switch.test.tsx
```

- [ ] **Step 3: Implement**

- Store memakai pola `useSyncExternalStore` yang sama; baca localStorage lazy; validasi nilai dengan `DEMO_AUTH_MODES`.
- `setDemoAuthMode` menulis localStorage dan notify.
- `useDemoAuth` mengembalikan `{ mode, isCustomer: mode === "customer", setMode: setDemoAuthMode, toggle: toggleDemoAuthMode }`.
- `DemoAuthSwitch`:
  - `if (!import.meta.env.DEV) return null;`
  - Fixed bottom-left `z-50`, pill putih dengan border `#E5E7EB`, shadow.
  - Tombol memakai `Button` size `sm`; aktif `bg-[#111111] text-white`, idle `bg-white text-[#4B5563]`.
  - `data-testid="demo-auth-switch"`.

- [ ] **Step 4: Run tests to verify they pass**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/lib/demo-auth-store.test.ts src/features/shop/components/orders/demo-auth-switch.test.tsx
```

- [ ] **Step 5: Format changed files**

```powershell
pnpm --filter client-web-delysa-florist exec prettier --write src/features/shop/lib/demo-auth-store.ts src/features/shop/hooks/use-demo-auth.ts src/features/shop/components/orders/demo-auth-switch.tsx src/features/shop/lib/demo-auth-store.test.ts src/features/shop/components/orders/demo-auth-switch.test.tsx
```

---

### Task 5: Filters, Search Schema, Pagination Extension

**Files:**
- Create: `apps/web/src/features/shop/lib/order-filters.ts`
- Create: `apps/web/src/features/shop/schemas/order-history-search-schema.ts`
- Modify: `apps/web/src/features/shop/components/catalog/catalog-pagination.tsx`
- Test: `apps/web/src/features/shop/lib/order-filters.test.ts`
- Test: `apps/web/src/features/shop/schemas/order-history-search-schema.test.ts`
- Test: `apps/web/src/features/shop/components/catalog/catalog-pagination.test.tsx`

**Interfaces:**
- Produces:
  - `ORDER_HISTORY_PAGE_SIZE = 4`
  - `ORDER_TABS`
  - `filterOrders(orders, query: Pick<OrderHistorySearch, "q" | "period" | "status">, now?): OrderRecord[]`
  - `countOrdersByTab(orders, query: Pick<OrderHistorySearch, "q" | "period">, now?): Record<OrderTab, number>`
  - `sortOrders(orders, sort): OrderRecord[]`
  - `paginateOrders(orders, page, pageSize?): { items; page; pageCount; total }`
  - `orderHistorySearchSchema`
  - `OrderHistorySearch = z.infer<typeof orderHistorySearchSchema>`
  - `CatalogPagination` props baru `itemLabel?: string`, `ariaLabel?: string`

- [ ] **Step 1: Write failing tests**

`order-filters.test.ts`:
- Query `"8842"` cocok dengan kode; query `"mawar"` cocok dengan nama item; query `"sari"` cocok dengan nama penerima; case-insensitive.
- Periode `30d`/`90d`/`1y`/`all` memakai cutoff dari `now` tetap.
- Tab `closed` mencakup `cancelled` + `rejected`; tab `delivered` hanya delivered.
- `countOrdersByTab` dihitung setelah query + periode, sebelum filter tab; `all` = total basis.
- Sort `newest`, `oldest`, `total_desc`; tie-break `createdAt` desc.
- `paginateOrders` halaman 1/2, clamp halaman terlalu besar, total 0 → `pageCount` 1 dan items kosong.

`order-history-search-schema.test.ts`:
- Object kosong → `{ period: "30d", sort: "newest", status: "all", page: 1 }`.
- `page: "3"` → number 3.
- `page: "abc"`, `period: "x"`, `sort: "x"`, `status: "x"` → fallback default.
- `q` terlalu panjang / bukan string → `undefined`.

`catalog-pagination.test.tsx`:
- Default masih menampilkan "produk buket & rangkaian" dan `aria-label="Pagination katalog"`.
- Dengan `itemLabel="pesanan"` dan `ariaLabel="Pagination riwayat pesanan"`, teks dan aria berubah.
- Klik "Selanjutnya" memanggil `onPage(page + 1)`; tombol disabled di batas.

- [ ] **Step 2: Run tests to verify they fail**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/lib/order-filters.test.ts src/features/shop/schemas/order-history-search-schema.test.ts src/features/shop/components/catalog/catalog-pagination.test.tsx
```

- [ ] **Step 3: Implement**

`order-filters.ts`:
- `ORDER_TABS` persis:

```ts
export const ORDER_TABS = [
  { value: "all", label: "Semua", statuses: ORDER_STATUSES },
  { value: "pending_payment", label: "Belum Bayar", statuses: ["pending_payment"] },
  { value: "pending_verification", label: "Verifikasi", statuses: ["pending_verification"] },
  { value: "paid", label: "Dibayar", statuses: ["paid"] },
  { value: "processing", label: "Diproses", statuses: ["processing"] },
  { value: "shipped", label: "Dikirim", statuses: ["shipped"] },
  { value: "delivered", label: "Selesai", statuses: ["delivered"] },
  { value: "closed", label: "Dibatalkan", statuses: ["cancelled", "rejected"] },
] as const;
```

- `filterOrders` menerima `Pick<OrderHistorySearch, "q" | "period" | "status">`; cutoff memakai `now.getTime() - days * 86_400_000`.
- `countOrdersByTab` memakai basis `filterOrders(orders, { ...query, status: "all" }, now)`, lalu hitung per tab.
- `paginateOrders` clamp `safePage = Math.min(Math.max(1, page), pageCount)`.

`order-history-search-schema.ts`:

```ts
export const orderHistorySearchSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  period: z.enum(["30d", "90d", "1y", "all"]).catch("30d"),
  sort: z.enum(["newest", "oldest", "total_desc"]).catch("newest"),
  status: z
    .enum([
      "all",
      "pending_payment",
      "pending_verification",
      "paid",
      "processing",
      "shipped",
      "delivered",
      "closed",
    ])
    .catch("all"),
  page: z.coerce.number().int().min(1).catch(1),
});
```

`CatalogPagination`:
- Tambah props `itemLabel = "produk buket & rangkaian"` dan `ariaLabel = "Pagination katalog"`.
- Ganti teks hardcoded dengan `{itemLabel}`; ganti `aria-label` nav dengan `{ariaLabel}`.
- Jangan ubah markup/tombol lain.

- [ ] **Step 4: Run tests to verify they pass**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/lib/order-filters.test.ts src/features/shop/schemas/order-history-search-schema.test.ts src/features/shop/components/catalog/catalog-pagination.test.tsx
```

- [ ] **Step 5: Format changed files**

```powershell
pnpm --filter client-web-delysa-florist exec prettier --write src/features/shop/lib/order-filters.ts src/features/shop/schemas/order-history-search-schema.ts src/features/shop/components/catalog/catalog-pagination.tsx src/features/shop/lib/order-filters.test.ts src/features/shop/schemas/order-history-search-schema.test.ts src/features/shop/components/catalog/catalog-pagination.test.tsx
```

---

### Task 6: Reusable Order UI + Trust Strip

**Files:**
- Create: `apps/web/src/features/shop/lib/clipboard.ts`
- Create: `apps/web/src/features/shop/components/orders/order-status-badge.tsx`
- Create: `apps/web/src/features/shop/components/orders/order-status-timeline.tsx`
- Create: `apps/web/src/features/shop/components/orders/copy-order-code-button.tsx`
- Modify: `apps/web/src/features/shop/components/storefront/trust-strip.tsx`
- Test: `apps/web/src/features/shop/lib/clipboard.test.ts`
- Test: `apps/web/src/features/shop/components/orders/order-status-badge.test.tsx`
- Test: `apps/web/src/features/shop/components/orders/order-status-timeline.test.tsx`
- Test: `apps/web/src/features/shop/components/orders/copy-order-code-button.test.tsx`
- Test: `apps/web/src/features/shop/components/storefront/trust-strip.test.tsx`

**Interfaces:**
- Produces:
  - `copyText(value: string, label: string): Promise<boolean>`
  - `OrderStatusBadge({ status, className?, ...props })` dengan props `React.ComponentProps<"span">`
  - `OrderStatusTimeline({ events, status })`
  - `CopyOrderCodeButton({ code, className?, label? })`
  - `TrustItem = { title; subtitle; icon: LucideIcon }`
  - `TrustStrip({ items?: readonly TrustItem[], ariaLabel? })`

- [ ] **Step 1: Write failing tests**

`clipboard.test.ts`:
- `navigator.clipboard.writeText` dipanggil dan toast success.
- Clipboard tidak tersedia → return false dan toast error.

`order-status-badge.test.tsx`:
- `pending_payment` menampilkan "Menunggu Pembayaran" dan `data-status`.
- `delivered` menampilkan "Selesai".
- `cancelled` memakai kelas tone danger.

`order-status-timeline.test.tsx`:
- 6 stage dirender berurutan.
- Order `paid` dengan 3 event: stage 1–3 `data-state="done"`/`current`, stage 4–6 `upcoming`; timestamp tampil.
- Order `cancelled`: tampil alert terminal dengan note; stage flow terakhir `current`, stage setelahnya `upcoming`.
- Event terakhir sama dengan status order.

`copy-order-code-button.test.tsx`:
- Klik memanggil `copyText(code, "Kode pesanan")`.
- `aria-label` menyebut kode.

`trust-strip.test.tsx`:
- Default merender 4 item `STOREFRONT_TRUST`.
- `items` custom 3 item merender 3 item dan ikon yang diberikan.
- `ariaLabel` custom diterapkan.

- [ ] **Step 2: Run tests to verify they fail**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/lib/clipboard.test.ts src/features/shop/components/orders/order-status-badge.test.tsx src/features/shop/components/orders/order-status-timeline.test.tsx src/features/shop/components/orders/copy-order-code-button.test.tsx src/features/shop/components/storefront/trust-strip.test.tsx
```

- [ ] **Step 3: Implement**

- `clipboard.ts` memakai `toast` dari `~/components/ui/toast`; pesan sama dengan `CheckoutSuccess.copyValue`.
- `OrderStatusBadge` menerima `React.ComponentProps<"span">` dan menyebarkan `...props`; memakai `getOrderStatusMeta` + mapping tone:
  - warning: `bg-[#FFF3ED] text-[#C2410C] ring-[#FF6B35]/20`
  - info: `bg-sky-50 text-sky-700 ring-sky-200`
  - success: `bg-emerald-50 text-emerald-700 ring-emerald-200`
  - progress: `bg-indigo-50 text-indigo-700 ring-indigo-200`
  - danger: `bg-rose-50 text-rose-700 ring-rose-200`
  - neutral: `bg-[#F3F4F6] text-[#4B5563] ring-[#E5E7EB]`
- `OrderStatusTimeline`:
  - Stage dari `ORDER_FLOW` + `getOrderStatusMeta`.
  - `lastFlowIndex = Math.max(-1, ...events.map((event) => ORDER_FLOW.indexOf(event.status)))`.
  - `currentIndex = meta.stepIndex ?? lastFlowIndex`; jika `-1`, semua stage `upcoming`.
  - State: `i < currentIndex` → `done`; `i === currentIndex` → `current`; else `upcoming`.
  - Timestamp dari event yang cocok; note jika ada.
  - Connector line vertikal; ikon `Check` untuk done, dot untuk current, `Circle` untuk upcoming.
  - Jika `isClosedOrderStatus(status)`, render `<Alert variant="destructive">` dengan label + note event terakhir.
- `CopyOrderCodeButton` memakai `Copy`/`Check` icon; state copied 2 detik; `copyText`.
- `TrustStrip`:
  - Export `TrustItem`.
  - `DEFAULT_TRUST_ITEMS` memetakan `STOREFRONT_TRUST` + `ICONS` lama.
  - Props `items = DEFAULT_TRUST_ITEMS`, `ariaLabel = "Keunggulan toko"`.
  - Render `item.icon`.

- [ ] **Step 4: Run tests to verify they pass**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/lib/clipboard.test.ts src/features/shop/components/orders/order-status-badge.test.tsx src/features/shop/components/orders/order-status-timeline.test.tsx src/features/shop/components/orders/copy-order-code-button.test.tsx src/features/shop/components/storefront/trust-strip.test.tsx
```

- [ ] **Step 5: Format changed files**

```powershell
pnpm --filter client-web-delysa-florist exec prettier --write src/features/shop/lib/clipboard.ts src/features/shop/components/orders/order-status-badge.tsx src/features/shop/components/orders/order-status-timeline.tsx src/features/shop/components/orders/copy-order-code-button.tsx src/features/shop/components/storefront/trust-strip.tsx src/features/shop/lib/clipboard.test.ts src/features/shop/components/orders/order-status-badge.test.tsx src/features/shop/components/orders/order-status-timeline.test.tsx src/features/shop/components/orders/copy-order-code-button.test.tsx src/features/shop/components/storefront/trust-strip.test.tsx
```

---

### Task 7: Extract `PaymentProofUploader`

**Files:**
- Create: `apps/web/src/features/shop/components/orders/payment-proof-uploader.tsx`
- Modify: `apps/web/src/features/checkout/components/CheckoutSuccess.tsx`
- Test: `apps/web/src/features/shop/components/orders/payment-proof-uploader.test.tsx`

**Interfaces:**
- Produces:
  - `PaymentProofUploader({ orderId, status, onStatusChange?, description?, className? })`
- Consumes:
  - `uploadPaymentProof`, `getPaymentProofError`, `PAYMENT_PROOF_ACCEPT`, `formatFileSize`, `toast`.

- [ ] **Step 1: Write failing tests**

`payment-proof-uploader.test.tsx`:
- Status `pending_payment`: input file dan tombol "Kirim bukti pembayaran" tampil.
- File valid diunggah → `uploadPaymentProof(orderId, file)` dipanggil; `onStatusChange("pending_verification")`; summary "Bukti pembayaran diterima" tampil.
- File >5MB atau tipe tidak didukung → pesan error, API tidak dipanggil.
- Status `pending_verification`: summary tampil, input tidak ada.
- Status `paid`: komponen render `null`.
- Upload gagal → pesan error dan tombol bisa dicoba lagi.

Mock `~/features/checkout/api/endpoints` dengan `vi.mock`; gunakan `File` dari jsdom.

- [ ] **Step 2: Run test to verify it fails**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/components/orders/payment-proof-uploader.test.tsx
```

- [ ] **Step 3: Implement extraction**

- Pindahkan state uploader dari `CheckoutSuccess` (`selectedFile`, `uploadedFile`, `previewUrl`, `isDragging`, `isUploading`, `uploadError`, `inputRef`, `useEffect` preview, `selectFile`, `handleDrop`, `handleUpload`) ke komponen baru.
- `showProofSummary = Boolean(uploadedFile) || status === "pending_verification"`.
- `canUpload = status === "pending_payment"`.
- `if (status !== "pending_payment" && status !== "pending_verification") return null;`
- Setelah sukses: `setUploadedFile(selectedFile); setSelectedFile(null); onStatusChange?.(updatedOrder.status);` toast sama.
- `description` default: `"Unggah bukti pembayaran agar pesanan segera diverifikasi."`.
- Pertahankan `data-testid="payment-proof-input"`, `payment-proof-dropzone`, `upload-success`.
- Di `CheckoutSuccess`:
  - Hapus import/state/handler uploader.
  - Ganti blok card upload dengan:

```tsx
<PaymentProofUploader
  orderId={order.id}
  status={status}
  onStatusChange={setStatus}
  description={
    bank
      ? "Unggah bukti transfer agar pesanan segera diverifikasi."
      : "Unggah bukti pembayaran QRIS agar pesanan segera diverifikasi."
  }
/>
```

  - Pertahankan `status` state, `setStatus`, `formatIDR`, `copyValue`, WhatsApp.
  - Hapus `ORDER_STATUS_LABELS` dan `statusTone`; ganti badge markup dengan `<OrderStatusBadge status={status} data-testid="order-status" />` agar label tidak duplikat dan test selector lama tetap aman.
- Jangan ubah teks/CTA lain.

- [ ] **Step 4: Run test + existing checkout tests**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/components/orders/payment-proof-uploader.test.tsx src/features/checkout
```

- [ ] **Step 5: Format changed files**

```powershell
pnpm --filter client-web-delysa-florist exec prettier --write src/features/shop/components/orders/payment-proof-uploader.tsx src/features/checkout/components/CheckoutSuccess.tsx src/features/shop/components/orders/payment-proof-uploader.test.tsx
```

---

### Task 8: Checkout → Order Record + Status Link

**Files:**
- Create: `apps/web/src/features/checkout/lib/order-record.ts`
- Test: `apps/web/src/features/checkout/lib/order-record.test.ts`
- Modify: `apps/web/src/features/checkout/hooks/use-checkout.ts`
- Modify: `apps/web/src/features/checkout/hooks/use-checkout.test.tsx`
- Modify: `apps/web/src/features/checkout/components/CheckoutSuccess.tsx`

**Interfaces:**
- Produces:
  - `buildOrderRecord({ order, form, lines, totals, now? }): OrderRecord`
- Consumes:
  - `getPaymentMethod`, `OrderResponse`, `CheckoutFormData`, `CartTotals`, `MiniCartLine`.

- [ ] **Step 1: Write failing tests**

`order-record.test.ts`:
- BCA: `payment.methodId === "manual_transfer_bca"`, label "Transfer Manual BCA", bank `054-082-9912`, steps 3.
- QRIS: `payment.methodId === "qris"`, `bank` undefined.
- `paymentDeadline` = `now + 24 jam`; `timeline` satu event `pending_payment` dengan note "Pesanan dibuat".
- `items` dan `totals` disalin (mutasi sumber tidak mengubah record).
- `customNote` kosong menjadi `undefined`.
- `order.total` dari mock tidak dipakai; `totals.grandTotal` tetap dari cart.

`use-checkout.test.tsx` (tambahan):
- Mock `saveOrder` dari `~/features/shop/lib/order-store`.
- Setelah submit sukses, `saveOrder` dipanggil sekali dengan record berisi `code`, `status`, `payment.label`, `items`, `totals`.
- `clearCart` tetap dipanggil.
- Jika `saveOrder` melempar error, submit tetap resolve dan `clearCart` tetap dipanggil.

- [ ] **Step 2: Run tests to verify they fail**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/checkout/lib/order-record.test.ts src/features/checkout/hooks/use-checkout.test.tsx
```

- [ ] **Step 3: Implement**

`order-record.ts`:

```ts
export function buildOrderRecord({
  order,
  form,
  lines,
  totals,
  now = new Date(),
}: {
  order: OrderResponse;
  form: CheckoutFormData;
  lines: MiniCartLine[];
  totals: CartTotals;
  now?: Date;
}): OrderRecord {
  const createdAt = now.toISOString();
  const method = getPaymentMethod(form.paymentMethod);
  return {
    id: order.id,
    code: order.code,
    status: order.status,
    createdAt,
    updatedAt: createdAt,
    paymentDeadline: new Date(now.getTime() + 86_400_000).toISOString(),
    recipientName: form.recipientName,
    recipientPhone: form.recipientPhone,
    shippingAddress: form.shippingAddress,
    customNote: form.customNote || undefined,
    items: lines.map((line) => ({ ...line })),
    totals: { ...totals },
    payment: {
      methodId: method?.id ?? "",
      label: method?.label ?? "Metode pembayaran belum tercatat",
      description: method?.description ?? "",
      bank: method?.bank ? { ...method.bank } : undefined,
      steps: method?.steps ? [...method.steps] : [],
    },
    timeline: [
      { status: order.status, at: createdAt, note: "Pesanan dibuat" },
    ],
  };
}
```

`use-checkout.ts`:
- Import `buildOrderRecord` dan `saveOrder`.
- Setelah `createOrder` sukses, sebelum `clearDraft`:

```ts
try {
  saveOrder(buildOrderRecord({ order, form: formData, lines, totals }));
} catch {
  // Order sudah dibuat; kegagalan menyimpan riwayat demo tidak menggagalkan checkout.
}
```

`CheckoutSuccess.tsx`:
- Tambah tombol/link di bawah CTA WhatsApp:

```tsx
<Button
  variant="outline"
  render={
    <Link
      to="/status-pesanan/$kodePesanan"
      params={{ kodePesanan: order.code }}
    />
  }
  className="h-10 w-full rounded-lg border-[#E5E7EB] bg-white font-semibold text-[#1A1A1A] hover:bg-[#F7F7F8]"
>
  Lacak status pesanan
</Button>
```

- [ ] **Step 4: Run tests to verify they pass**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/checkout/lib/order-record.test.ts src/features/checkout/hooks/use-checkout.test.tsx
```

- [ ] **Step 5: Format changed files**

```powershell
pnpm --filter client-web-delysa-florist exec prettier --write src/features/checkout/lib/order-record.ts src/features/checkout/hooks/use-checkout.ts src/features/checkout/hooks/use-checkout.test.tsx src/features/checkout/components/CheckoutSuccess.tsx src/features/checkout/lib/order-record.test.ts
```

---

### Task 9: Status Page Subcomponents

**Files:**
- Create: `apps/web/src/features/shop/components/orders/order-status-summary.tsx`
- Create: `apps/web/src/features/shop/components/orders/order-payment-card.tsx`
- Create: `apps/web/src/features/shop/components/orders/order-items-card.tsx`
- Create: `apps/web/src/features/shop/components/orders/order-delivery-card.tsx`
- Create: `apps/web/src/features/shop/components/orders/order-code-lookup-form.tsx`
- Create: `apps/web/src/features/shop/components/orders/order-not-found.tsx`
- Test: `apps/web/src/features/shop/components/orders/order-status-summary.test.tsx`
- Test: `apps/web/src/features/shop/components/orders/order-payment-card.test.tsx`
- Test: `apps/web/src/features/shop/components/orders/order-items-card.test.tsx`
- Test: `apps/web/src/features/shop/components/orders/order-delivery-card.test.tsx`
- Test: `apps/web/src/features/shop/components/orders/order-code-lookup-form.test.tsx`
- Test: `apps/web/src/features/shop/components/orders/order-not-found.test.tsx`

**Interfaces:**
- `OrderStatusSummary({ order })`
- `OrderPaymentCard({ order, onStatusChange })`
- `OrderItemsCard({ order })`
- `OrderDeliveryCard({ order, isCustomer })`
- `OrderCodeLookupForm({ initialCode?, onSubmit, className? })`
- `OrderNotFound({ code, onLookup })`

- [ ] **Step 1: Write failing tests**

`order-status-summary.test.tsx`:
- Menampilkan "Status Pesanan", kode, badge, dan timeline 6 stage.
- Order `cancelled` menampilkan alert terminal.
- Order `delivered` menampilkan "Pesanan selesai" dan `deliveredAt`.

`order-payment-card.test.tsx`:
- BCA: label, total, nomor rekening, "a.n. Kartinah", countdown/teks batas pembayaran.
- QRIS: label QRIS, tidak ada nomor rekening, CTA "Minta QRIS via WhatsApp".
- `pending_payment`: uploader tampil.
- `pending_verification`: teks "Bukti pembayaran sedang diverifikasi admin", input upload tidak ada.
- `paid`: "Pembayaran terverifikasi", tidak ada uploader.
- `rejected`: alert penolakan + CTA WhatsApp.
- Deadline lewat: "Batas pembayaran telah lewat" dan uploader tetap tampil.

`order-items-card.test.tsx`:
- Item name, varian, qty, harga tampil.
- Totals: subtotal, diskon produk, ongkir GRATIS/25.000, kupon, grand total.
- `formatIDR` dipakai (teks `Rp`).

`order-delivery-card.test.tsx`:
- Guest: nama/telepon/alamat dimask; info "Aktifkan login demo" tampil.
- Customer: nama/telepon/alamat penuh.
- `shipped`: kurir + nomor resi tampil.
- `customNote` tampil jika ada.

`order-code-lookup-form.test.tsx`:
- Submit kosong → error "Masukkan kode pesanan", callback tidak dipanggil.
- Input `"  dlf-20261024-8842 "` → callback `"DLF-20261024-8842"`.
- `initialCode` mengisi input.

`order-not-found.test.tsx`:
- Menampilkan kode yang dicari.
- Form lookup memanggil `onLookup` dengan kode baru.
- CTA WhatsApp ada.

- [ ] **Step 2: Run tests to verify they fail**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/components/orders/order-status-summary.test.tsx src/features/shop/components/orders/order-payment-card.test.tsx src/features/shop/components/orders/order-items-card.test.tsx src/features/shop/components/orders/order-delivery-card.test.tsx src/features/shop/components/orders/order-code-lookup-form.test.tsx src/features/shop/components/orders/order-not-found.test.tsx
```

- [ ] **Step 3: Implement components**

- Semua kartu memakai `rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm` atau varian yang konsisten.
- `OrderStatusSummary`: card dengan header kode + `CopyOrderCodeButton` + `OrderStatusBadge`, `formatOrderDate(createdAt)`, `OrderStatusTimeline`; jika `status === "delivered"` dan `deliveredAt`, tampil `Pesanan selesai pada {formatOrderDate(deliveredAt)}`.
- `OrderPaymentCard`:
  - `const method = order.payment;`
  - Total: `formatIDR(order.totals.grandTotal)`.
  - BCA: rekening + salin (`copyText`), a.n.
  - QRIS: teks "QR code dikirim admin via WhatsApp".
  - Countdown: `const countdown = useCountdown(new Date(order.paymentDeadline));` tampil `Sisa waktu {countdown.hours}:{countdown.minutes}:{countdown.seconds}` dan `Bayar sebelum {formatOrderDate(deadline)}`; jika `Date.parse(deadline) <= Date.now()` tampil "Batas pembayaran telah lewat".
  - Uploader: `<PaymentProofUploader orderId={order.id} status={order.status} onStatusChange={onStatusChange} description={order.payment.methodId === "qris" ? "Unggah bukti pembayaran QRIS agar pesanan segera diverifikasi." : "Unggah bukti transfer agar pesanan segera diverifikasi."} />`.
  - WhatsApp CTA memakai `WHATSAPP_NUMBER` dari `features/checkout/payment-methods` (konstanta saja, bukan `getPaymentMethod`).
  - Status notes:
    - `pending_verification`: "Bukti pembayaran sedang diverifikasi admin."
    - `paid`/`processing`/`shipped`/`delivered`: "Pembayaran terverifikasi."
    - `rejected`: `Alert` destructive "Pembayaran ditolak. Hubungi admin untuk tindak lanjut."
    - `cancelled`: "Pesanan dibatalkan."
- `OrderItemsCard`: render item rows + totals; gunakan `formatIDR`; `shipping === 0` → "GRATIS".
- `OrderDeliveryCard`: gunakan `maskOrderName`, `maskOrderPhone`, `maskOrderAddress` untuk guest; full untuk customer; info kecil untuk guest berbunyi "Aktifkan login demo di kiri bawah untuk melihat data lengkap."
- `OrderCodeLookupForm`: form `onSubmit` preventDefault; input uppercase; error lokal.
- `OrderNotFound`: ikon `PackageX`, judul, deskripsi dengan kode, `OrderCodeLookupForm`, CTA WhatsApp (`WHATSAPP_NUMBER` dari `features/checkout/payment-methods`).

- [ ] **Step 4: Run tests to verify they pass**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/components/orders/order-status-summary.test.tsx src/features/shop/components/orders/order-payment-card.test.tsx src/features/shop/components/orders/order-items-card.test.tsx src/features/shop/components/orders/order-delivery-card.test.tsx src/features/shop/components/orders/order-code-lookup-form.test.tsx src/features/shop/components/orders/order-not-found.test.tsx
```

- [ ] **Step 5: Format changed files**

```powershell
pnpm --filter client-web-delysa-florist exec prettier --write src/features/shop/components/orders/order-status-summary.tsx src/features/shop/components/orders/order-payment-card.tsx src/features/shop/components/orders/order-items-card.tsx src/features/shop/components/orders/order-delivery-card.tsx src/features/shop/components/orders/order-code-lookup-form.tsx src/features/shop/components/orders/order-not-found.tsx src/features/shop/components/orders/order-status-summary.test.tsx src/features/shop/components/orders/order-payment-card.test.tsx src/features/shop/components/orders/order-items-card.test.tsx src/features/shop/components/orders/order-delivery-card.test.tsx src/features/shop/components/orders/order-code-lookup-form.test.tsx src/features/shop/components/orders/order-not-found.test.tsx
```

---

### Task 10: Status Page View + Route

**Files:**
- Create: `apps/web/src/features/shop/view/order-status-page.tsx`
- Create: `apps/web/src/routes/_shop/status-pesanan.$kodePesanan.tsx`
- Test: `apps/web/src/features/shop/view/order-status-page.test.tsx`

**Interfaces:**
- `OrderStatusPage({ code, onLookup }: { code: string; onLookup: (code: string) => void })`

- [ ] **Step 1: Write failing tests**

`order-status-page.test.tsx`:
- Mock `useOrder`, `useDemoAuth`, `useMiniCart`, `useNavigate`, `updateOrderStatus`.
- Kode dikenal + guest: summary tampil; nama penerima dimask; gunakan `await screen.findBy...` karena view menunggu `mounted`.
- Kode dikenal + customer: nama penerima penuh.
- Kode tidak dikenal: `OrderNotFound` tampil dan `onLookup` dipanggil dari form.
- Upload sukses (mock `PaymentProofUploader` callback) memanggil `updateOrderStatus(order.code, "pending_verification", { note: "Bukti pembayaran diunggah" })`.
- Klik "Pesan lagi" memanggil `add` (dari `useMiniCart`) untuk setiap item dan navigate ke `/keranjang`.

- [ ] **Step 2: Run test to verify it fails**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/view/order-status-page.test.tsx
```

- [ ] **Step 3: Implement view and route**

`order-status-page.tsx`:
- `"use client";`
- `const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), []);`
- `const order = useOrder(code); const { isCustomer } = useDemoAuth(); const { add } = useMiniCart(); const navigate = useNavigate();`
- Definisikan handler setelah guard `if (!mounted)` dan `if (!order)` agar `order` ter-narrow.
- `handleStatusChange(status)` → `updateOrderStatus(order.code, status, { note: status === "pending_verification" ? "Bukti pembayaran diunggah" : undefined })`.
- `handleReorder()` → `order.items.forEach((line) => add(line)); void navigate({ to: "/keranjang" });`.
- Render:
  - `Breadcrumb` Home / Riwayat Pesanan / Status Pesanan. Gunakan:
    ```tsx
    <BreadcrumbLink
      render={<button type="button" onClick={() => navigate({ to: "/" })} />}
    >
      Home
    </BreadcrumbLink>
    <BreadcrumbLink
      render={
        <button
          type="button"
          onClick={() => navigate({ to: "/riwayat-pesanan" })}
        />
      }
    >
      Riwayat Pesanan
    </BreadcrumbLink>
    <BreadcrumbPage>Status Pesanan</BreadcrumbPage>
    ```
    Ini agar view tidak bergantung pada konteks router untuk `Link`.
  - Jika `!mounted`: 3 skeleton cards (`animate-pulse`).
  - Jika `!order`: `<OrderNotFound code={code} onLookup={onLookup} />`.
  - Jika ada: grid `lg:grid-cols-[minmax(0,1fr)_360px]`; kiri `OrderStatusSummary`, `OrderItemsCard`, `OrderDeliveryCard`; kanan `OrderPaymentCard`, tombol "Pesan lagi", CTA WhatsApp.
- Route:

```tsx
export const Route = createFileRoute("/_shop/status-pesanan/$kodePesanan")({
  head: () => ({
    meta: [
      { title: "Status Pesanan — Delysa Florist" },
      { name: "description", content: "Lacak status pesanan Delysa Florist." },
    ],
  }),
  component: StatusRouteComponent,
});

function StatusRouteComponent() {
  const { kodePesanan } = Route.useParams();
  const navigate = Route.useNavigate();
  return (
    <OrderStatusPage
      code={kodePesanan}
      onLookup={(code) =>
        void navigate({
          to: "/status-pesanan/$kodePesanan",
          params: { kodePesanan: code },
        })
      }
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/view/order-status-page.test.tsx
```

- [ ] **Step 5: Format changed files**

```powershell
pnpm --filter client-web-delysa-florist exec prettier --write src/features/shop/view/order-status-page.tsx "src/routes/_shop/status-pesanan.$kodePesanan.tsx" src/features/shop/view/order-status-page.test.tsx
```

---

### Task 11: History Subcomponents

**Files:**
- Create: `apps/web/src/features/shop/components/orders/order-history-header.tsx`
- Create: `apps/web/src/features/shop/components/orders/order-history-toolbar.tsx`
- Create: `apps/web/src/features/shop/components/orders/order-history-tabs.tsx`
- Create: `apps/web/src/features/shop/components/orders/order-history-card.tsx`
- Create: `apps/web/src/features/shop/components/orders/order-history-empty.tsx`
- Create: `apps/web/src/features/shop/components/orders/order-history-locked.tsx`
- Test: `apps/web/src/features/shop/components/orders/order-history-header.test.tsx`
- Test: `apps/web/src/features/shop/components/orders/order-history-toolbar.test.tsx`
- Test: `apps/web/src/features/shop/components/orders/order-history-tabs.test.tsx`
- Test: `apps/web/src/features/shop/components/orders/order-history-card.test.tsx`
- Test: `apps/web/src/features/shop/components/orders/order-history-empty.test.tsx`
- Test: `apps/web/src/features/shop/components/orders/order-history-locked.test.tsx`

**Interfaces:**
- `OrderHistoryHeader({ isCustomer })`
- `OrderHistoryToolbar({ q, period, sort, resultCount, onChange })`
- `OrderHistoryTabs({ value, counts, onChange })`
- `OrderHistoryCard({ order, onOpen, onReorder })`
- `OrderHistoryEmpty({ onLookup, onBrowse })`
- `OrderHistoryLocked({ onEnableDemo, onLookup })`

- [ ] **Step 1: Write failing tests**

`order-history-header.test.tsx`:
- Heading "Pesanan Saya".
- Customer: sapaan `Sari` tampil; guest: tidak tampil.
- CTA WhatsApp ada.

`order-history-toolbar.test.tsx`:
- Search debounce 300ms memanggil `onChange({ q, page: 1 })`; gunakan fake timers.
- Periode/sort memanggil `onChange` dengan `page: 1`.
- `resultCount` tampil di aria-live.

`order-history-tabs.test.tsx`:
- 8 tab dirender; count tampil.
- Klik tab memanggil `onChange(tab)`; `aria-pressed` benar.

`order-history-card.test.tsx`:
- Kode, tanggal, badge, item, total tampil.
- `pending_payment` → tombol "Bayar sekarang" memanggil `onOpen`.
- `delivered` → "Pesan lagi" memanggil `onReorder`; "Lihat detail" memanggil `onOpen`.
- `cancelled` → "Lihat detail" + WhatsApp.
- Item lebih dari 2 menampilkan "+N item lainnya".

`order-history-empty.test.tsx`:
- Empty state + CTA "Jelajahi katalog" memanggil `onBrowse` + form lookup; submit memanggil `onLookup`.

`order-history-locked.test.tsx`:
- Lock icon, judul, CTA "Aktifkan login demo" memanggil `onEnableDemo`.
- Form lookup memanggil `onLookup`.

- [ ] **Step 2: Run tests to verify they fail**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/components/orders/order-history-header.test.tsx src/features/shop/components/orders/order-history-toolbar.test.tsx src/features/shop/components/orders/order-history-tabs.test.tsx src/features/shop/components/orders/order-history-card.test.tsx src/features/shop/components/orders/order-history-empty.test.tsx src/features/shop/components/orders/order-history-locked.test.tsx
```

- [ ] **Step 3: Implement**

- Header: heading + subtitle; customer chip `Halo, Sari`; concierge card dengan WhatsApp (`WHATSAPP_NUMBER` dari `features/checkout/payment-methods`).
- Toolbar: pola debounce 300ms seperti `CatalogToolbar`; input lokal disinkronkan saat prop `q` berubah (back/forward); nilai kosong dikirim sebagai `q: undefined`; `Select` periode (`30d` "30 hari", `90d` "90 hari", `1y` "1 tahun", `all` "Semua") dan sort (`newest` "Terbaru", `oldest` "Terlama", `total_desc` "Total tertinggi").
- Tabs: `<div role="group" aria-label="Filter status pesanan">` berisi pill buttons dengan `aria-pressed`; horizontal scroll `overflow-x-auto`.
- Card:
  - Header: `CopyOrderCodeButton`, `formatOrderDate`, `OrderStatusBadge`.
  - Items: 2 thumbnail + nama + qty; `+N item lainnya`.
  - Footer: total + actions.
  - Action table:
    - `pending_payment`: primary "Bayar sekarang" → `onOpen`.
    - `pending_verification`: primary "Cek verifikasi" → `onOpen`.
    - `paid`: "Lihat detail" → `onOpen`.
    - `processing`: "Lihat progres" → `onOpen`.
    - `shipped`: "Lacak pesanan" → `onOpen`.
    - `delivered`: primary "Pesan lagi" → `onReorder`; secondary "Lihat detail" → `onOpen`.
    - `cancelled`/`rejected`: primary "Lihat detail" → `onOpen`; secondary WhatsApp.
  - WhatsApp link `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Halo Delysa Florist, saya ingin bertanya tentang pesanan " + order.code)}`; impor `WHATSAPP_NUMBER` dari `features/checkout/payment-methods`.
- Empty: `PackageOpen` icon, "Belum ada pesanan", Button "Jelajahi katalog" memanggil `onBrowse`, `OrderCodeLookupForm`.
- Locked: `LockKeyhole` icon, "Riwayat pesanan terkunci", deskripsi, Button "Aktifkan login demo", `OrderCodeLookupForm`, catatan "Mode demo ini hanya menyimpan data di browser."

- [ ] **Step 4: Run tests to verify they pass**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/components/orders/order-history-header.test.tsx src/features/shop/components/orders/order-history-toolbar.test.tsx src/features/shop/components/orders/order-history-tabs.test.tsx src/features/shop/components/orders/order-history-card.test.tsx src/features/shop/components/orders/order-history-empty.test.tsx src/features/shop/components/orders/order-history-locked.test.tsx
```

- [ ] **Step 5: Format changed files**

```powershell
pnpm --filter client-web-delysa-florist exec prettier --write src/features/shop/components/orders/order-history-header.tsx src/features/shop/components/orders/order-history-toolbar.tsx src/features/shop/components/orders/order-history-tabs.tsx src/features/shop/components/orders/order-history-card.tsx src/features/shop/components/orders/order-history-empty.tsx src/features/shop/components/orders/order-history-locked.tsx src/features/shop/components/orders/order-history-header.test.tsx src/features/shop/components/orders/order-history-toolbar.test.tsx src/features/shop/components/orders/order-history-tabs.test.tsx src/features/shop/components/orders/order-history-card.test.tsx src/features/shop/components/orders/order-history-empty.test.tsx src/features/shop/components/orders/order-history-locked.test.tsx
```

---

### Task 12: History Page View + Route

**Files:**
- Create: `apps/web/src/features/shop/view/order-history-page.tsx`
- Create: `apps/web/src/routes/_shop/riwayat-pesanan.tsx`
- Test: `apps/web/src/features/shop/view/order-history-page.test.tsx`

**Interfaces:**
- `OrderHistoryPage({ search, onSearchChange }: { search: OrderHistorySearch; onSearchChange: (patch: Partial<OrderHistorySearch>) => void })`

- [ ] **Step 1: Write failing tests**

`order-history-page.test.tsx`:
- Mock `useOrders`, `useDemoAuth`, `useMiniCart`, `useNavigate`.
- Guest: `OrderHistoryLocked` tampil setelah `mounted`; daftar order tidak tampil.
- Customer: header + toolbar + tabs + 4 kartu + pagination tampil; gunakan `await screen.findBy...` karena view menunggu `mounted`.
- Search change memanggil `onSearchChange({ q, page: 1 })`.
- Klik tab `delivered` memanggil `onSearchChange({ status: "delivered", page: 1 })`.
- Pagination halaman 2 memanggil `onSearchChange({ page: 2 })`.
- Filter tanpa hasil: `OrderHistoryEmpty` tampil.
- Klik "Aktifkan login demo" memanggil `setMode("customer")`.
- Klik kartu "Bayar sekarang" navigate ke `/status-pesanan/$kodePesanan` dengan kode order.
- Klik "Pesan lagi" memanggil `add` dan navigate ke `/keranjang`.

- [ ] **Step 2: Run test to verify it fails**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/view/order-history-page.test.tsx
```

- [ ] **Step 3: Implement view and route**

`order-history-page.tsx`:
- `"use client";`
- `mounted` state + skeleton.
- `const { orders } = useOrders(); const { isCustomer, setMode } = useDemoAuth(); const { add } = useMiniCart(); const navigate = useNavigate();`
- `const now = new Date();`
- `const counts = countOrdersByTab(orders, { q: search.q, period: search.period }, now);`
- `const filtered = filterOrders(orders, search, now); const sorted = sortOrders(filtered, search.sort); const page = paginateOrders(sorted, search.page, ORDER_HISTORY_PAGE_SIZE);`
- Guest render: `OrderHistoryHeader`, `<OrderHistoryLocked onEnableDemo={handleEnableDemo} onLookup={handleLookup} />`, `TrustStrip` dengan 3 item:
  - `{ title: "Pembayaran aman", subtitle: "Verifikasi manual oleh admin", icon: ShieldCheck }`
  - `{ title: "Bunga segar", subtitle: "Dirangkai hari pengiriman", icon: Flower2 }`
  - `{ title: "Bantuan cepat", subtitle: "WhatsApp admin responsif", icon: Headset }`
- Customer render: header, toolbar, tabs, list/empty (`<OrderHistoryEmpty onBrowse={handleBrowse} onLookup={handleLookup} />`), pagination, trust strip.
- `handleOpen(order)` navigate status; `handleReorder(order)` `order.items.forEach((line) => add(line))` + navigate `/keranjang`; `handleLookup(code)` navigate status; `handleEnableDemo` setMode customer; `handleBrowse()` navigate `/katalog`.
- Route:

```tsx
export const Route = createFileRoute("/_shop/riwayat-pesanan")({
  validateSearch: orderHistorySearchSchema,
  head: () => ({
    meta: [
      { title: "Pesanan Saya — Delysa Florist" },
      {
        name: "description",
        content: "Pantau status dan riwayat pesanan Delysa Florist.",
      },
    ],
  }),
  component: HistoryRouteComponent,
});

function HistoryRouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <OrderHistoryPage
      search={search}
      onSearchChange={(patch) =>
        void navigate({
          search: (prev) => ({ ...prev, ...patch }),
          replace: true,
        })
      }
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/view/order-history-page.test.tsx
```

- [ ] **Step 5: Format changed files**

```powershell
pnpm --filter client-web-delysa-florist exec prettier --write src/features/shop/view/order-history-page.tsx src/routes/_shop/riwayat-pesanan.tsx src/features/shop/view/order-history-page.test.tsx
```

---

### Task 13: Header, Mobile Nav, Demo Switch Mount

**Files:**
- Modify: `apps/web/src/features/shop/components/storefront/shop-header.tsx`
- Modify: `apps/web/src/features/shop/components/storefront/shop-mobile-nav.tsx`
- Modify: `apps/web/src/routes/_shop/route.tsx`
- Test: `apps/web/src/features/shop/components/storefront/shop-header.test.tsx`

**Interfaces:**
- `ShopNavTo` bertambah `"/riwayat-pesanan"`.
- `NAV_LINKS` bertambah `{ label: "Pesanan Saya", to: "/riwayat-pesanan" }`.

- [ ] **Step 1: Write failing test**

`shop-header.test.tsx`:
- Mock `@tanstack/react-router` hooks (`useLocation`, `useNavigate`) dan `Link` menjadi `<a href={to}>`; buang `activeOptions`/`activeProps`/`inactiveProps` agar tidak menjadi atribut DOM.
- Mock `useMiniCart` count 0.
- Guest: link `aria-label="Riwayat pesanan"` mengarah ke `/riwayat-pesanan`; sapaan customer tidak tampil.
- Customer (mock `useDemoAuth`): teks `Sari` tampil di samping ikon akun.
- `NAV_LINKS` memuat "Pesanan Saya" dengan `to: "/riwayat-pesanan"`.

- [ ] **Step 2: Run test to verify it fails**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/components/storefront/shop-header.test.tsx
```

- [ ] **Step 3: Implement**

- `shop-header.tsx`:
  - Tambah `"/riwayat-pesanan"` ke `ShopNavTo`.
  - Tambah nav item "Pesanan Saya" (setelah "Promo Spesial", sebelum "About").
  - Import `useDemoAuth`, `DEMO_CUSTOMER_NAME`.
  - `const { isCustomer } = useDemoAuth();`
  - Ganti `DeadLink label="Akun saya"` dengan `Link to="/riwayat-pesanan" aria-label="Riwayat pesanan"`; tampilkan `DEMO_CUSTOMER_NAME.split(" ")[0]` di `hidden sm:inline` saat customer.
- `shop-mobile-nav.tsx`: hapus `<li>` "Akun saya (segera hadir)"; link "Pesanan Saya" sudah dirender dari `NAV_LINKS`, jadi jangan membuat link duplikat di daftar bawah.
- `routes/_shop/route.tsx`: import `DemoAuthSwitch`; render setelah `<Outlet />` dan sebelum `<ShopFooter />`.

- [ ] **Step 4: Run test + build route tree**

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/shop/components/storefront/shop-header.test.tsx
pnpm --filter client-web-delysa-florist build
```

- [ ] **Step 5: Format changed files**

```powershell
pnpm --filter client-web-delysa-florist exec prettier --write src/features/shop/components/storefront/shop-header.tsx src/features/shop/components/storefront/shop-mobile-nav.tsx src/routes/_shop/route.tsx src/features/shop/components/storefront/shop-header.test.tsx
```

---

### Task 14: Full Verification + Manual QA

**Files:**
- No production file changes expected; fix only regressions found.

- [ ] **Step 1: Run full test suite**

```powershell
pnpm --filter client-web-delysa-florist test
```

Expected: semua test lulus, termasuk test checkout lama.

- [ ] **Step 2: Run build/typecheck**

```powershell
pnpm --filter client-web-delysa-florist build
```

Expected: `vite build` sukses, `tsc --noEmit` sukses, `routeTree.gen.ts` memuat kedua route baru. Jangan edit file generated manual.

- [ ] **Step 3: Run formatting and lint**

```powershell
pnpm --filter client-web-delysa-florist format:check
pnpm lint
```

Jika `format:check` gagal, jalankan `pnpm --filter client-web-delysa-florist format` lalu ulangi.

- [ ] **Step 4: Manual QA checklist**

Jalankan `pnpm dev:web`, lalu:

1. Buka `/riwayat-pesanan` sebagai guest → state terkunci, form lookup berfungsi, tidak redirect.
2. Klik switch "Login demo" → daftar 14 order dalam 30 hari, PII penuh di status page.
3. Ubah search/periode/sort/tab → URL search berubah, hasil dan count konsisten, page reset ke 1.
4. Buka order `pending_payment` → timeline, countdown, rekening BCA, uploader tampil.
5. Upload JPG <5MB → status berubah ke "Menunggu Verifikasi", timeline bertambah, badge riwayat berubah; refresh tetap tersimpan.
6. Buka `/status-pesanan/<kode>` di jendela incognito → data tampil, PII dimask.
7. Buka kode tidak dikenal → not-found + lookup.
8. Checkout baru dari `/checkout?step=review` → sukses → klik "Lacak status pesanan" → order baru tampil; buka `/riwayat-pesanan` → order baru di paling atas.
9. Uji viewport 375px, 768px, 1280px: tidak ada horizontal overflow, tab bisa di-scroll, kartu menumpuk rapi.
10. Toggle "Anonim" → riwayat kembali terkunci; status page tetap bisa dibuka via kode dengan PII dimask.

- [ ] **Step 5: Final diff review**

```powershell
git status --short
git diff --stat
```

Pastikan tidak ada perubahan pada `packages/shared/openapi.yaml`, `packages/shared/src/constants.ts`, atau `apps/web/src/routes/routeTree.gen.ts` yang dibuat manual.

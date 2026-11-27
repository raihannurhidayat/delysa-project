# Rencana Implementasi: Halaman Admin "Manajemen Pesanan & Antrian Fulfillment" (`/admin/pesanan`)

Tanggal: 2026-11-02
Status: Disetujui user (gate Fase 3 & gate Fase 0, 2026-11-02)
Riset: `docs/research/admin-orders-management.md`
Referensi visual: Gambar 1 (mockup admin orders, lampiran user)

> Ditulis untuk engineer yang belum mengenal repo ini. Jalankan sistematis per task
> dengan TDD: **test ditulis dulu (merah) → implementasi minimal → test hijau → commit**.

---

## 1. Ringkasan & Tujuan

Menambahkan halaman admin **`/admin/pesanan`** yang menampilkan antrian fulfillment:
3 kartu antrean prioritas, tabs status (8 tab dengan count), toolbar (search, periode
tanggal, chip Batch Wisuda UNSIL, reset), tabel 7 kolom dengan aksi per baris,
drawer detail order, dialog **Buat Pesanan Manual**, dan paginasi. Sumber data adalah
**order-store shop yang sudah ada** (`features/shop`: localStorage + seed 16 demo order);
field yang tidak ada di `OrderRecord` (SLA, batch UNSIL, meja florist, kurir) dibuat
sebagai **enrichment dummy deterministik di layer admin** tanpa mengubah store.
Nav sidebar item "Pesanan" diaktifkan. Iterasi ini **frontend + store client**, tanpa
wiring API asli (endpoint `GET /orders` belum ada di kontrak — `packages/shared/openapi.yaml`).

## 2. Acceptance Criteria

1. **Given** admin login, **when** membuka `/admin/pesanan`, **then** halaman tampil:
   header + 3 kartu antrean (Menunggu Verifikasi Resi / Sedang Dirangkai / Dalam
   Pengantaran) dengan count benar, tabs status dengan count, dan tabel order dari
   store; **user non-admin di-redirect** (guard `beforeLoad` pola `produk.tsx`).
2. **Given** salah satu tab status, periode, chip batch, atau search berubah,
   **then** daftar terfilter dan paginasi kembali ke halaman 1; count setiap tab
   tetap dihitung dari orders yang sama **sebelum** filter tab diterapkan.
3. **Given** tombol kartu antrean diklik, **then** tab status terkait aktif
   (Menunggu Verifikasi → `pending_verification`, Sedang Dirangkai → `processing`,
   Dalam Pengantaran → `shipped`).
4. **Given** order di `pending_verification`, **then** tombol "Verifikasi" mengubah
   status jadi `paid` dan "Tolak" (wajib isi alasan → dialog) jadi `rejected`;
   **Given** order di `paid/processing/shipped`, **then** aksi "Mulai Rakit" /
   "Tandai Dikirim" / "Tandai Selesai" memajukan status sesuai titik transisi
   (`ORDER_STATUSES` — **tidak menambah status baru**); status diubah lewat
   `updateOrderStatus` sehingga timeline bertambah dan riwayat pelanggan ikut berubah.
5. **Given** tombol "Lihat" pada baris, **then** drawer detail menampilkan kode,
   status, item, pembayaran, dan timeline order tersebut.
6. **Given** tombol "+ Buat Pesanan Manual", **then** dialog form tervalidasi Zod;
   submit membuat order baru di store dengan kode `DLF-YYYYMMDD-XXXX`, status awal
   `pending_payment`, dan event timeline "Pesanan dibuat oleh admin" — order muncul
   di daftar dan di halaman riwayat pelanggan yang ada.
7. **Given** hasil filter kosong / store kosong (SSR-first render), **then** empty
   state eksplisit (2 varian: "Belum ada pesanan", "Tidak ada hasil yang cocok"
   + tombol reset), dan tabel tidak crash saat snapshot kosong.
8. Sidebar admin menampilkan item "Pesanan" aktif di `/admin/pesanan`; item nav lain
   yang belum aktif tetap disabled.
9. Format check, seluruh suite Vitest, dan build (termasuk `tsc --noEmit`)
   lulus; render manual di 375px / 768px / 1440px memuaskan (tabel scroll
   horizontal, kartu menumpuk, toolbar membungkus).

## 3. Asumsi & Di Luar Scope

**Asumsi** (disetujui user Fase 0):
- Reuse order-store shop (`features/shop`), dummy field di layer admin.
- Read-only + aksi status baris (mutasi store client yang sudah ada).
- Bahasa Indonesia; palet repo (`#FF6B35`, `#111111`, `#E5E7EB`, `#FFF3ED`); harga IDR.
- Label tab admin memakai kata Gambar 1 ("Menunggu Pembayaran", "Menunggu Verifikasi",
  "Sudah Dibayar", "Sedang Dirangkai", "Dalam Pengantaran", "Selesai Terkirim",
  "Dibatalkan & Ditolak") — dipetakan ke `ORDER_TABS` yang ada tanpa membuat enum baru.
- Enrichment dummy **tidak dipersist**: fungsi hash deterministik dari `code` order,
  jadi nilai sama pada setiap load dan stabil untuk test (kolom SLA/batch/meja/kurir
  muncul di daftar; detail bisnis nyata menyusul saat backend siap).
- Page size 8 baris (konsistensi dengan admin produk) — mockup menulis 20; konsistensi
  repo diprioritaskan; konstanta eksplisit sehingga mudah diubah.

**Di luar scope** (keputusan user): Export CSV, banner kebijakan UNSIL + link SOP,
tombol WA/Posisi/Struk, kolom sort klik-header penuh, filter state di URL
(`validateSearch`), bulk/select-all, dark mode, virtualisasi, wiring API asli,
perubahan `packages/shared/**` dan `apps/api/**`.

## 4. Temuan Repo (bukti path)

- **Stack**: React 19, TanStack Start 1.168 / Router ^1.170.41, TanStack Table ^9.3.1
  **sudah dipakai** admin produk, Tailwind v4 + komponen Base-UI/shadcn, Zod ^3.23.8,
  RHF ^7.62, Vitest 5 + Testing Library (test colocated, setup
  `apps/web/vitest.setup.ts`) — `apps/web/package.json`.
- **Guard & route pola**: `apps/web/src/routes/_admin/admin/produk.tsx`
  (`beforeLoad` role guard + `roleHome`, `head` meta, route file tipis).
- **Pola halaman**: `apps/web/src/features/admin/pages/admin-products-page.tsx`
  (komposisi: header → stats → tabs → toolbar → table → pagination → dialog); state di
  page component; filter/sorting murni di `features/admin/lib/products/*`.
- **Data order**: *16 demo order* (semua 8 status, tanggal relatif, si kurir utk
  shipped/delivered) — `apps/web/src/features/shop/data/orders.ts`
  (`createDemoOrders`); store publik —
  `apps/web/src/features/shop/lib/order-store.ts` (`saveOrder`,
  `updateOrderStatus(code, status, event?)`, `subscribeOrders`, `getOrderSnapshot`,
  `getOrderServerSnapshot`, `findOrderByCode`, `normalizeOrderCode`);
  hook — `apps/web/src/features/shop/hooks/use-orders.ts` (`useOrders` via
  `useSyncExternalStore`); SSR snapshot = `{ orders: [] }`.
- **Order meta**: 8 status + label/tone —
  `apps/web/src/features/shop/lib/order-status.ts` (`ORDER_STATUS_META`,
  `isClosedOrderStatus`); tabs — `apps/web/src/features/shop/lib/order-filters.ts`
  (`ORDER_TABS` 8 tab, `OrderTab` type di `features/shop/types.ts` baris 230);
  format — `features/shop/lib/format.ts` (`formatIDR`), `order-format.ts`
  (`formatOrderDate`, `formatOrderShortDate`); badge —
  `features/shop/components/orders/order-status-badge.tsx`; timeline & kartu —
  `order-status-timeline.tsx`, `order-payment-card.tsx`, `order-items-card.tsx`.
- **Record/item**: `OrderRecord` (`features/shop/types.ts` baris 208–226),
  `MiniCartLine` (baris 150–165, wajib: slug/name/image/sizeId/sizeLabel/wrapId/
  price/qty), `CartTotals` + `computeCartTotals(lines, coupon)`
  (`features/shop/lib/cart-totals.ts`), `getPaymentMethod(methodId)`
  (`features/shop/lib/payment-methods.ts`, `PAYMENT_METHOD_IDS = ["manual_transfer_bca", "qris"]`).
- **UI kit tersedia**: `apps/web/src/components/ui/` — table, tabs, badge, card,
  button, input, select, dialog, drawer, sheet, skeleton, toast, sidebar, dll.
  Pagination admin yang sudah dipakai ulang:
  `features/admin/components/produk/products-pagination.tsx`.
- **Konvensi**: tidak ada CLAUDE/AGENTS; double quotes + semicolon; `cn` dari `"cn"`;
  warna arbitrary Tailwind; rencana di `docs/superpowers/plans/`; riset di
  `docs/research/`; dilarang edit `routeTree.gen.ts`; `pnpm dev:web` (:3000).

## 5. Keputusan Desain & Alternatif yang Ditolak

| Aspek | Dipilih | Alternatif ditolak & alasannya |
|---|---|---|
| Sumber data | Reuse `useOrders()` + `updateOrderStatus` dari `features/shop`; enrichment dummy di layer admin (`AdminOrderView`) | Store order admin baru → duplikasi source of truth; wiring API → kontrak `GET /orders` belum ada (PRD-Backend/FE) |
| Enrichment | Field dummy **dihitung** hash deterministik dari `code`, tidak dipersist | Menyimpan dummy ke localStorage → menodai struktur `OrderRecord`, merusak shop user story; menambah persist manual |
| Tabel | TanStack Table v9 (`tableFeatures` + `createPaginatedRowModel`) mengikuti `product-table-config.ts` | Tabel manual `useMemo` → divergensi dari konvensi admin yang sekarang |
| Aksi status | Transisi legal di lib murni + hook wrapper panggil `updateOrderStatus` | Mutasi langsung di tombol → tak bisa dites murni; menambah status baru → langgar `packages/shared/src/constants.ts` |
| Buat pesanan manual | Form RHF+Zod → `createManualOrderRecord` (murni, dites) → `saveOrder` store | POST API → butuh idempotency key + backend; buildOrderRecord shop → butuh `OrderResponse`+`CheckoutFormData` yang tidak relevan konteks admin |
| Rail tab status | Rail custom ala `products-stock-tabs` + label Gambar 1, count dihitung dari `summarizeAdminOrders` | Komponen `Tabs` generik tanpa count/pill → visual Gambar 1 tidak tercapai |
| State filter | `useState` di page (pola products) | `validateSearch` di URL → bagus untuk share-link, tapi menambah kompleksitas; dicatat sebagai iterasi lanjut |
| Detail | Drawer `components/ui/drawer.tsx`, isi reuse kartu kartu shop | Modal besar kustom → duplikat timeline/payment/items yang sudah ada |

## 6. Reuse Decision Table

| Kebutuhan | Keputusan | Aset/Path | Alasan |
|---|---|---|---|
| Data order & mutasi status | **Reuse** | `features/shop/lib/order-store.ts`, `hooks/use-orders.ts` | teruji (`order-store.test.ts`), SSR-safe, sinkron dgn halaman pelanggan |
| Label & tone 8 status | **Reuse** | `features/shop/lib/order-status.ts`, `features/shop/components/orders/order-status-badge.tsx` | satu status dari yang sama di shop |
| Tab meta (statuses per tab) | **Reuse** | `features/shop/lib/order-filters.ts` (`ORDER_TABS`) | menyediakan `OrderTab` type di `features/shop/types.ts` |
| Format nilai | **Reuse** | `features/shop/lib/format.ts` (`formatIDR`), `order-format.ts` | teruji; admin hanya add `formatRelativeAge` dkk. |
| Primitif tabel | **Reuse** | `components/ui/table.tsx`, `products-pagination.tsx` | pagination admin sudah sejajar |
| Pattern tabel v9 | **Reuse pola** | `features/admin/lib/products/product-table-config.ts`, `product-columns.tsx` | API v9 verified context7; pola repo |
| Route + guard | **Reuse pola** | `routes/_admin/admin/produk.tsx` | identik struktur |
| Nav item "Pesanan" | **Extend** | `features/admin/components/layout/sidebar/admin-nav.tsx` | item terdaftar tapi disabled (union `to` perlu diperluas) |
| Primitif UI (dialog/drawer/select/input/badge/card/button) | **Reuse** | `components/ui/*` | semua tersedia |
| Filter/summary/transisi/kolom/kode order | **Create** | `features/admin/lib/pesanan/*` | kebutuhan admin (SLA, batch, antrean) tidak ada di shop |
| Hooks | **Create** | `features/admin/hooks/use-admin-orders.ts`, `use-admin-order-actions.ts` | layer admin, testable |
| Komponen halaman | **Create** | `features/admin/components/pesanan/*` | tidak ada padanan; ikuti pola `components/produk` |
| Halaman | **Create** | `features/admin/pages/admin-orders-page.tsx` | mengikuti `features/admin/pages` |

### File Placement Map

```text
apps/web/src/features/admin/lib/pesanan/
  admin-order.types.ts        # AdminOrderView, AdminOrderEnrichment, AdminOrderFilters, tab summary types
  admin-order-enrichment.ts   # enrichAdminOrder (batch/SLA/meja/kurir dummy, hash dari code)
  admin-order-format.ts       # formatRelativeAge, summarizeItems, shortAddress
  admin-order-filters.ts      # DEFAULT_ADMIN_ORDER_FILTERS, filterAdminOrders, summarizeAdminOrders, TAB_LABELS
  admin-order-transition.ts   # ADMIN_ORDER_ACTIONS, getAdminOrderActions, findAction
  manual-order.ts             # generateManualOrderCode, MANUAL_ORDER_FORM_SCHEMA, createManualOrderRecord
  admin-order-table-config.ts # adminOrderTableFeatures, AdminOrderTable, ADMIN_ORDER_PAGE_SIZE
  admin-order-columns.tsx     # createAdminOrderColumns({ onView, onAction, onReject })
  admin-order-enrichment.test.ts, admin-order-format.test.ts,
  admin-order-filters.test.ts, admin-order-transition.test.ts,
  manual-order.test.ts        # test colocated (pola repo)

apps/web/src/features/admin/hooks/
  use-admin-orders.ts         # useOrders() + enrichment + mounted flag
  use-admin-order-actions.ts  # applyAction(order, actionId) → updateOrderStatus

apps/web/src/features/admin/components/pesanan/    # komponen + test colocated
  admin-orders-page-header.tsx     admin-order-stats-cards.tsx
  admin-order-status-tabs.tsx      admin-order-toolbar.tsx
  admin-order-table.tsx            admin-order-reject-dialog.tsx
  admin-order-detail-drawer.tsx    admin-order-manual-dialog.tsx

apps/web/src/features/admin/pages/
  admin-orders-page.tsx (+ admin-orders-page.test.tsx)

apps/web/src/routes/_admin/admin/pesanan.tsx   # route tipis + guard admin + head
apps/web/src/features/admin/components/layout/sidebar/admin-nav.tsx   # MODIFY
apps/web/src/features/admin/components/layout/sidebar/admin-nav.test.tsx  # MODIFY
```

Perintah verifikasi (dari root repo):
- test satu file (path relatif terhadap `apps/web`, cwd vitest = `apps/web`):
  `pnpm --filter client-web-delysa-florist exec vitest run src/features/admin/lib/pesanan/admin-order-filters.test.ts`
  (ganti `<path>` sesuai file yang diuji)
- full suite: `pnpm --filter client-web-delysa-florist test`
- typecheck+build: `pnpm --filter client-web-delysa-florist build`
- lint & format: `pnpm -r lint` (hanya `packages/shared` yang punya script linter),
  `pnpm --filter client-web-delysa-florist format:check`
- dev: `pnpm dev:web` → http://localhost:3000 (login admin dulu untuk akses `/admin`)

## 7. Task Berurutan

> Setiap task: test dulu (merah) → implementasi → test hijau → commit.
> Commit message pakai prefix `feat(admin): …` / `test(admin): …` mengikuti riwayat.

---

### Task 1 — Tipe admin + enrichment dummy deterministik

- **Tujuan**: kontrak data view admin + field dummy (batch/SLA/meja/kurir) murni & teruji.
- **File**:
  - `apps/web/src/features/admin/lib/pesanan/admin-order.types.ts`:
    ```ts
    import type { OrderRecord, OrderTab } from "~/features/shop/types";
    export type AdminOrderBatch = "unsil";
    export type AdminOrderView = OrderRecord & {
      batch?: AdminOrderBatch;            // hash kode % 3 === 0 → "unsil"
      priority: "prioritas" | "normal";   // unsil utk status tunggu-verifikasi → prioritas
      slaBreached: boolean;               // pending_verification && umur > 90 mnt
      workbench?: string;                 // processing → "Meja Florist {1..3}"
      courierLabel?: string;              // shipped → order.courier ?? "Kurir Atelier"
      paymentKind: "manual" | "instant" | "invoice"; // payment.bank ? "manual" : "invoice"
    };
    export type AdminOrderFilters = {
      search: string;
      statusTab: OrderTab;
      period: "today" | "7d" | "all";
      batch: "all" | AdminOrderBatch;
    };
    ```
  - `apps/web/src/features/admin/lib/pesanan/admin-order-enrichment.ts`:
    ```ts
    export function hashOrderCode(code: string): number      // jumlah charCode
    export function enrichAdminOrder(order: OrderRecord, now?: Date): AdminOrderView
    export function enrichAdminOrders(orders: OrderRecord[], now?: Date): AdminOrderView[]
    ```
    Rules: `batch` jika `hash % 3 === 0`; `priority` jika status `pending_verification`
    & batch unsil; `slaBreached`: `pending_verification && (now - createdAt) > 90mnt`;
    `workbench` = `Meja Florist ${1 + hash % 3}` hanya saat `processing`;
    `courierLabel` = `order.courier ?? "Kurir Atelier: Dedi S."` hanya saat `shipped`.
    Deterministik — tidak ada `Math.random`.
- **Test** (merah dulu) `admin-order-enrichment.test.ts`: batch muncul utk kode dgn
  hash kelipatan 3 (kode fixture eksplisit), tidak memutasi `OrderRecord` input,
  `slaBreached` true pada umur > 90 mnt, `workbench` null di luar processing,
  output stabil untuk panggilan ulang dgn `now` sama.
- **Verifikasi**: vitest path hijau. **Commit**: `feat(admin): tipe & enrichment order admin`.

### Task 2 — Helper format admin

- **File**: `apps/web/src/features/admin/lib/pesanan/admin-order-format.ts`:
  ```ts
  export function formatRelativeAge(now: Date, createdAt: string): string
  //  "18 menit lalu", "2 jam lalu", "3.1 jam lalu" (≥2 jam pakai 1 desimal), "3 hari lalu"
  export function summarizeItems(items: { name: string; qty: number }[]): string
  //  "2 item: Monolith Peach + 2 Sunflower" (maks 1 nama pertama + jumlah item)
  export function shortAddress(address: string, maxLen?: number): string  // default 28 + "…"
  ```
- **Test** `admin-order-format.test.ts`: tiap fungsi — batas menit/jam/hari, string
  multi-item, alamat panjang terpotong.
- **Verifikasi**: vitest path hijau. **Commit**: `feat(admin): helper format order admin`.

### Task 3 — Filter, summary, label tab admin

- **File**: `apps/web/src/features/admin/lib/pesanan/admin-order-filters.ts`:
  ```ts
  export const DEFAULT_ADMIN_ORDER_FILTERS: AdminOrderFilters; // tab "all", period "all", batch "all"
  export const ADMIN_TAB_LABELS: Record<OrderTab, string>;
  //  all:"Semua", pending_payment:"Menunggu Pembayaran", pending_verification:"Menunggu Verifikasi",
  //  paid:"Sudah Dibayar", processing:"Sedang Dirangkai", shipped:"Dalam Pengantaran",
  //  delivered:"Selesai Terkirim", closed:"Dibatalkan & Ditolak"
  export function filterAdminOrders(
    orders: AdminOrderView[], filters: AdminOrderFilters, now: Date,
  ): AdminOrderView[]
  //  search: lowercase code/recipientName/items[].name (polanya matchesQuery di
  //  features/shop/lib/order-filters.ts baris 39); tab via statuses ORDER_TABS;
  //  period "today": createdAt >= startOf(now, hari Asia/Jakarta);
  //  period "7d": createdAt >= now - 7d; batch: "unsil" → hanya ber-batch.
  export function summarizeAdminOrders(orders: AdminOrderView[]): {
    verification: number;        // pending_verification
    assembly: number;            // processing
    delivery: number;            // shipped
    counts: Record<OrderTab, number>;
  }
  ```
  Catatan komposisi di page: **counts untuk rail dihitung dari orders penuh dgn semua
  filter KECUALI statusTab** (agar count tetap informatif ketika satu tab dipilih) —
  pola `categoryScopedProducts` di `admin-products-page.tsx` baris 64–71.
- **Test** `admin-order-filters.test.ts`: filter gabungan (tab+search+period+batch),
  case-insensitive search, summary count benar pada fixture 8 status.
- **Verifikasi**: vitest path hijau. **Commit**: `feat(admin): filter & summary antrian pesanan`.

### Task 4 — Transisi status legal

- **File**: `apps/web/src/features/admin/lib/pesanan/admin-order-transition.ts`:
  ```ts
  import type { OrderStatus } from "@delysa/shared";
  export type AdminOrderActionId =
    | "verify" | "reject" | "start-assembly" | "mark-shipped" | "mark-delivered";
  export type AdminOrderActionSpec = {
    id: AdminOrderActionId; label: string; target: OrderStatus;
    variant: "default" | "destructive";
  };
  export function getAdminOrderActions(status: OrderStatus): AdminOrderActionSpec[];
  export function findAction(id: AdminOrderActionId, status: OrderStatus): AdminOrderActionSpec | null;
  //  pending_payment → [] ; pending_verification → verify(paid, default) + reject(rejected, destructive)
  //  paid → start-assembly(processing) ; processing → mark-shipped(shipped)
  //  shipped → mark-delivered(delivered) ; delivered/cancelled/rejected → []
  ```
  Semua `status`/`target` berasal dari `ORDER_STATUSES` (`@delysa/shared`) — tidak menambah status baru.
- **Test** `admin-order-transition.test.ts`: tiap status punya aksi benar; terminal
  status tanpa aksi; semua `target` valid lewat `isOrderStatus`
  (import dari `~/features/shop/lib/order-status.ts`, bukan `@delysa/shared`).
- **Verifikasi**: vitest path hijau. **Commit**: `feat(admin): transisi status pesanan admin`.

### Task 5 — Kode order manual + record builder

- **File**: `apps/web/src/features/admin/lib/pesanan/manual-order.ts`:
  ```ts
  export function generateManualOrderCode(now: Date): string
  // "DLF-" + YYYYMMDD dari `now` + "-" + 4 [A-Z0-9] dari Math.random
  export const MANUAL_ORDER_FORM_SCHEMA   // zod: itemName≥2, itemQty int 1–99,
  // itemPrice int ≥ 1, recipientName 2–100, recipientPhone 9–20, shippingAddress 10–500,
  // customNote ≤ 500 (opsional)
  export function createManualOrderRecord(values, code: string, now?: Date): OrderRecord
  // items = [{ slug: slugify(itemName), name, image: "", sizeId: "", sizeLabel: "",
  //           wrapId: "", price: itemPrice, qty: itemQty }]
  // totals = computeCartTotals(items, null)  (features/shop/lib/cart-totals.ts)
  // payment = getPaymentMethod("manual_transfer_bca") snapshot spt buildOrderRecord
  // status "pending_payment", timeline [{ status, at, note: "Pesanan dibuat oleh admin" }]
  ```
- **Test** `manual-order.test.ts`: kode cocok `/^DLF-\d{8}-[A-Z0-9]{4}$/` & unik pada
  50 panggilan; record lolos `isOrderRecord` (dari `features/shop/lib/order-storage.ts`);
  validasi Zod menolak field di luar rentang.
- **Verifikasi**: vitest path hijau. **Commit**: `feat(admin): builder pesanan manual`.

### Task 6 — Konfigur tabel v9 + kolom 7 kolom

- **File**:
  - `apps/web/src/features/admin/lib/pesanan/admin-order-table-config.ts` —
    `adminOrderTableFeatures = tableFeatures({ rowSortingFeature, rowPaginationFeature,
    sortedRowModel: createSortedRowModel(), paginatedRowModel: createPaginatedRowModel(),
    sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic } })`;
    `export type AdminOrderTable = ReactTable<typeof adminOrderTableFeatures, AdminOrderView>`;
    `export const ADMIN_ORDER_PAGE_SIZE = 8;`
  - `apps/web/src/features/admin/lib/pesanan/admin-order-columns.tsx` —
    `createAdminOrderColumns({ onView, onAction, onReject })` — `columnHelper`
    `createColumnHelper<typeof adminOrderTableFeatures, AdminOrderView>()`; kolom:
    1. `code` — kode mono `#111111` + jam WIB (`formatOrderShortDate`) + chip
       `Badge` "Wisuda UNSIL" bila ada batch;
    2. `recipient` — nama + telp + `shortAddress`;
    3. `total` — `formatIDR(grandTotal)` + `summarizeItems(items)`;
    4. `metode` — `payment.symbol` (BCA/label bank) + label kind;
    5. `umur` — `formatRelativeAge` (kolom sort wajib) + workbench/kurir chip bila ada;
    6. `status` — `OrderStatusBadge` reuse + chip `SLA Normal`/`Prioritas`;
    7. `aksi` — `getAdminOrderActions(status)` → `Button` per aksi (destructive =
       "Tolak" → `onReject(order)`, lainnya `onAction(order, actionId)`) + `Button`
       outline "Lihat" → `onView(order)`.
- **Test** `admin-order-columns.test.tsx`: kolom render fixture, klik aksi/Lihat/Tolak
  memanggil callback dgn order benar; badge batch/SLA muncul syaratnya masuk.
- **Verifikasi**: vitest path hijau + `pnpm --filter client-web-delysa-florist build`.
  **Commit**: `feat(admin): kolom & config tabel v9 pesanan`.

### Task 7 — Hook data & hook aksi

- **File**:
  - `apps/web/src/features/admin/hooks/use-admin-orders.ts`:
    ```ts
    export function useAdminOrders(): { orders: AdminOrderView[]; mounted: boolean };
    // useOrders() + enrichAdminOrders(now) via useMemo; mounted state useEffect-first
    ```
  - `apps/web/src/features/admin/hooks/use-admin-order-actions.ts`:
    ```ts
    export function useAdminOrderActions(): { applyAction(
      order: AdminOrderView, actionId: AdminOrderActionId): OrderRecord | null };
    // findAction → updateOrderStatus(order.code, target, { note: spec.label })
    ```
- **Test** `use-admin-order-actions.test.tsx`: `renderHook` — applyAction memanggil
  `updateOrderStatus` (mock module `~/features/shop/lib/order-store` via
  `vi.mock`) dgn args benar; status tanpa aksi mengembalikan `null`.
- **Verifikasi**: vitest path hijau. **Commit**: `feat(admin): hooks data & aksi pesanan`.

### Task 8 — Header halaman + kartu antrean

- **File** (komponen + test colocated, pola `components/produk/products-page-header.tsx`):
  - `apps/web/src/features/admin/components/pesanan/admin-orders-page-header.tsx` —
    props `{ onCreateManual(): void }`; eyebrow "BACK-OFFICE · ORDERS";
    H1 "Manajemen Pesanan & Antrian Fulfillment"; deskripsi sesuai Gambar 1;
    `Button` "+ Buat Pesanan Manual".
  - `apps/web/src/features/admin/components/pesanan/admin-order-stats-cards.tsx` —
    props `{ verification: number; assembly: number; delivery: number;
    onSelect(queue: "verification" | "assembly" | "delivery"): void }`; 3 `Card`:
    "Menunggu Verifikasi Resi" (badge merah "Prioritas 1"), "Sedang Dirangkai Hari Ini"
    (chip "Atelier Queue"), "Dalam Pengantaran" (chip hijau "On Road"); kartu adalah
    `button` fungsional (pola queue-first riset §1 B) → `onSelect`.
- **Test**: count dari props ter-render; klik kartu memanggil `onSelect` dgn queue benar.
- **Verifikasi**: vitest path hijau. **Commit**: `feat(admin): header & kartu antrean pesanan`.

### Task 9 — Rail tab status + toolbar

- **File**:
  - `apps/web/src/features/admin/components/pesanan/admin-order-status-tabs.tsx` —
    props `{ value: OrderTab; counts: Record<OrderTab, number>;
    onChange(tab: OrderTab): void }`; rail scrollable-x; pill count; tab aktif
    underline `#FF6B35`; aksesibel (`role="tablist"` + `aria-selected`).
  - `apps/web/src/features/admin/components/pesanan/admin-order-toolbar.tsx` —
    props `{ filters: AdminOrderFilters; onChange(next: AdminOrderFilters): void;
    resultCount: number; onReset(): void }`; ala Gambar 1: `Input` search
    ("Cari no. order, produk, atau nama pelanggan…"), `Select` periode
    (Hari Ini/7 Hari/Semua), chip `Select` Batch Wisuda UNSIL, tombol "Reset"
    (ikon + teks), teks "Menampilkan {resultCount} pesanan".
- **Test**: pilih tab/periode/batch/search → `onChange` dgn object filter baru; reset
  → `onReset` dipanggil; jumlah hasil ditampilkan di teks dengan `aria-live="polite"`.
- **Verifikasi**: vitest path hijau. **Commit**: `feat(admin): tabs & toolbar pesanan admin`.

### Task 10 — Tabel order + empty state + dialog Tolak

- **File**:
  - `apps/web/src/features/admin/components/pesanan/admin-order-table.tsx` —
    props `{ table: AdminOrderTable; hasFilters: boolean; onReset(): void;
    onView(order): void; onReject(order): void }`; memakai `components/ui/table.tsx`
    (`relative w-full overflow-x-auto`); 3 empty state (riset §2.4):
    store kosong → "Belum ada pesanan"; filter kosong → "Tidak ada hasil yang cocok"
    + tombol Reset; skeleton saat `mounted === false`.
  - `apps/web/src/features/admin/components/pesanan/admin-order-reject-dialog.tsx` —
    props `{ order: AdminOrderView | null; open: boolean; onOpenChange(open: boolean): void;
    onSubmit(code: string, reason: string): void }`; Zod `reason` 5–200 char wajib;
    `Button` destructive "Tolak Pesanan".
- **Test**: baris ter-paginasi (page size 8), 3 empty state, klik "Tolak" membuka
  dialog dan submit alasan memanggil `onSubmit` dgn kode & alasan; alasan < 5 char
  ditolak (pesan error).
- **Verifikasi**: vitest path hijau. **Commit**: `feat(admin): tabel pesanan & dialog tolak`.

### Task 11 — Drawer detail order

- **File**: `apps/web/src/features/admin/components/pesanan/admin-order-detail-drawer.tsx`
  — props `{ order: AdminOrderView | null; open: boolean; onOpenChange(open: boolean): void }`;
  isi: kode + badge status, kontak penerima, alamat, `OrderItemsCard`,
  `OrderPaymentCard`, `OrderStatusTimeline` (reuse
  `~/features/shop/components/orders/*`, props dilihat saat implementasi dari file tsb —
  reuse tanpa mengubahnya), chip dummy (batch/SLA/meja/kurir).
- **Test**: buka drawer dgn order fixture → kode/status/timeline ter-render;
  kosong → tidak crash.
- **Verifikasi**: vitest path hijau. **Commit**: `feat(admin): drawer detail pesanan`.

### Task 12 — Dialog Buat Pesanan Manual

- **File**: `apps/web/src/features/admin/components/pesanan/admin-order-manual-dialog.tsx` —
  props `{ open: boolean; onOpenChange(open: boolean): void;
  onSubmit(values: ManualOrderFormValues): void }` (pola `product-form-dialog.tsx`:
  RHF + `zodResolver(MANUAL_ORDER_FORM_SCHEMA)`); judul "Buat Pesanan Manual"; field
  sesuai schema Task 5; submit → `onSubmit` → parent `createManualOrderRecord(values,
  generateManualOrderCode(new Date()))` → `saveOrder(record)` (reuse
  `features/shop/lib/order-store.ts`) → tutup dialog.
- **Test**: validasi gagal saat kosong (pesan per-field); fill → `onSubmit` menerima
  nilai; order muncul di halaman store setelah submit (diuji di page test Task 13).
- **Verifikasi**: vitest path hijau. **Commit**: `feat(admin): dialog pesanan manual`.

### Task 13 — Halaman + route + nav aktif

- **File**:
  - `apps/web/src/features/admin/pages/admin-orders-page.tsx` — komposisi:
    state `filters` (`DEFAULT_ADMIN_ORDER_FILTERS`);
    `const { orders, mounted } = useAdminOrders();`
    `const { applyAction } = useAdminOrderActions();`
    `const table = useTable({ features: adminOrderTableFeatures,
      columns: createAdminOrderColumns({ onView, onReject, onAction: handleAction }),
      data: filteredOrders, initialState: { pagination: { pageIndex: 0, pageSize:
      ADMIN_ORDER_PAGE_SIZE } } });`
    `filteredOrders = filterAdminOrders(enriched, filters, now)`; rail counts =
    `summarizeAdminOrders(filterAdminOrders(enriched, { ...filters, statusTab: "all" }))`
    (penghitungan ini dijelaskan di Task 3); `handleAction`: `applyAction` atau `reject (dialog
    submit)` → toast feedback opsional (`components/ui/toast.tsx`); kartu `onSelect`
    → `setFilters({ ...filters, statusTab })`; layout: `header → stats → tabs →
    toolbar → table + pagination` ala `admin-products-page.tsx`; footnote mock
    (polanya baris 183–186 halaman produk). Halaman tanpa props `user` — role
    sudah divalidasi di route guard.
  - `apps/web/src/routes/_admin/admin/pesanan.tsx` —
    `createFileRoute("/_admin/admin/pesanan")` dgn `beforeLoad` role guard +
    `roleHome(context.user.role)` redirect (copy produk.tsx) + `head` meta
    "Pesanan — Admin Delysa Florist" + component → `<AdminOrdersPage />`.
  - `apps/web/src/features/admin/components/layout/sidebar/admin-nav.tsx` — item
    "Pesanan": `to: "/admin/pesanan"`; tipe `to` union ditambah
    `"/admin/pesanan"`.
- **Test**:
  - `admin-orders-page.test.tsx`: render (seed store via `saveOrder(createDemoOrders())`
    atau mock `useAdminOrders`) → kartu & baris tampil; cari memfilter;
    tab berpindah; klik kartu antrean mengubah tab; aksi Verifikasi mengubah status
    baris; tombol "+ Buat Pesanan Manual" membuka dialog dan submit menambah baris;
    route non-admin di-redirect (pola test `routes/_admin/admin.test.tsx`).
  - `admin-nav.test.tsx` (MODIFY): item "Pesanan" kini link `/admin/pesanan` aktif
    saat pathname cocok; item "Stok"/"Laporan" tetap disabled + badge "Segera".
- **Verifikasi** (cwd vitest = `apps/web`, jalankan path relatif `src/...`):
  - `pnpm --filter client-web-delysa-florist exec vitest run src/features/admin`
  - `pnpm --filter client-web-delysa-florist build`
- **Commit**: `feat(admin): halaman antrian pesanan admin dgn aksi status`.

### Task 14 — Verifikasi penuh & review responsif

- Jalankan berurutan dan wajib hijau:
  1. `pnpm -r lint` (catatan: hanya `packages/shared` yang punya script linter;
     verifikasi kode `apps/web` lewat langkah 2–4)
  2. `pnpm --filter client-web-delysa-florist format:check` (format terbaik:
     `pnpm --filter client-web-delysa-florist format` sebelum commit jika ada diff)
  3. `pnpm --filter client-web-delysa-florist test`
  4. `pnpm --filter client-web-delysa-florist build` (termasuk `tsc --noEmit`)
  5. `pnpm dev:web` → login admin → `/admin/pesanan`, cek manual 375px/768px/1440px:
     kartu menumpuk, tabel scroll-x, toolbar wrap, drawer ter-scroll, nav aktif;
     juga cek `/riwayat-pesanan` dan `/status-pesanan/<kode>` bahwa order yang
     diberi aksi admin ikut berubah status (sinkronisi store).
- Self-review diff vs acceptance criteria §2; laporkan hasil aktual (warning
  build yang sudah dikenal boleh).
- **Commit**: `chore(admin): verifikasi halaman pesanan admin`.

## 8. Rencana Verifikasi per Acceptance Criteria

| AC | Verifikasi |
|---|---|
| 1 | `admin-orders-page.test.tsx` render + test guard route (`routes/_admin/admin.test.tsx` pola); manual login admin |
| 2 | `admin-order-filters.test.ts` + page test tab/search/period reset page 1 |
| 3 | `admin-order-stats-cards` click → `onSelect` → state page tab berubah |
| 4 | `use-admin-order-actions` + kolom aksi + page test Verifikasi/Tolak (timeline bertambah → tampil di drawer detail & halaman riwayat/status pesanan shop) |
| 5 | `admin-order-detail-drawer.test.tsx` |
| 6 | `manual-order.test.ts` + `admin-order-manual-dialog.test.tsx` + page test |
| 7 | tiga empty state di `admin-order-table.test.tsx`; SSR-safe lewat `mounted` |
| 8 | modify `admin-nav.test.tsx` |
| 9 | `pnpm -r lint` hanya menjalankan linter `packages/shared` (`apps/web` tidak punya script lint) — verifikasi kode web: `format:check` + `test` + `build` (termasuk `tsc --noEmit`) + manual 375/768/1440 |

## 9. Risiko & Mitigasi

- **Store emptiness SSR/refresh**: `getServerSnapshot` = state kosong → page harus tampilkan
  skeleton/empty; mitigasi `mounted` flag (Task 7) mengikuti pola status-pesanan plan
  (`docs/superpowers/plans/2026-10-24-status-pesanan.md` §Global Constraints SSR).
- **Data user localStorage kotor**: order lama pelanggan muncul di daftar admin —
  perilaku benar (store adalah sumber data demo integrasi FE-2/FE-3/FE-4).
- **Klik ganda pada aksi status**: `updateOrderStatus` idempotent untuk status yang
  sama (mengembalikan order yang sama, tidak menambah timeline duplikat —
  `order-store-internal.ts` baris 93 `if (order.status === status) return order;`).
- **Kode order duplikat di pesanan manual**: `saveOrder` melakukan upsert berdasarkan
  kode; mitigasi: suffix 4 [A-Z0-9] acak → probabilitas tabrakan sangat kecil; test
  memastikan 50 kode hasil generate unik (Task 5).
- **Fitur "Batch Wisuda UNSIL" tidak ada di PRD**: diperlakukan sebagai dummy chip +
  filter client-side yang di-highlight sebagai data dummy untuk iterasi ini
  (catatan di footnote halaman); ketika backend/PRD mengejar, batch bisa dipetakan
  ke field API nyata tanpa mengubah UI.
- **Scope creep toolbar**: jangan menyalin kelengkapan `products-toolbar.tsx`
  (density/sort CSV) ke halaman ini; toolbar pesanan dibuat minimal sesuai Gambar 1
  (search, periode, batch, reset) — fitur lain menyusul bila diminta.

## 10. Referensi

- context7 `/tanstack/router` v1.114.3-skill, terverifikasi 2026-11-02: RBAC
  `beforeLoad` + `throw redirect` dan `head` meta —
  "Implement role-based access control with route beforeLoad" &
  "TanStack Start route head".
- context7 `/tanstack/table` v9 terverifikasi 2026-11-02: client pagination
  `tableFeatures({ rowPaginationFeature, paginatedRowModel: createPaginatedRowModel() })`
  dan migrasi row model v8→v9 — docs "Pagination (React) Guide" & "Row Model Factories".
- `docs/research/admin-orders-management.md` — temuan exa (HextaUI orders-table,
  Beamline orders admin, Polado/DWP operational screens, In8Sync fulfillment queue,
  uipkge order management).
- `docs/prd/PRD-Frontend-Delysa-Florist.md` FE-4 (baris 114–116);
  `packages/shared/src/constants.ts` (ORDER_STATUSES);
  `packages/shared/openapi.yaml` (OrderResponse baris 262–283).
- Preseden repo: `docs/superpowers/plans/2026-10-30-admin-products-page.md`,
  `docs/superpowers/plans/2026-10-24-status-pesanan.md`.

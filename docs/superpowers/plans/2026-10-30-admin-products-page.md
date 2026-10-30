# Rencana Implementasi: Halaman Admin Manajemen & Katalog Produk (Iterasi 1 — Frontend + Mock Data)

Tanggal: 2026-10-30
Status: Disetujui user (gate Fase 3, 2026-10-30)
Riset: `docs/research/admin-products-management.md`

## 1. Ringkasan & Tujuan

Menambahkan halaman admin "Produk" (`/admin/produk`) untuk mengelola dan menampilkan katalog produk: kartu statistik, pencarian + filter, tabel produk, pagination, dan dialog Tambah/Edit produk. Iterasi ini **frontend dengan mock data**; kontrak tipe disiapkan mengarah ke API berikutnya. Nav "Produk" di sidebar admin diaktifkan.

## 2. Acceptance Criteria

1. **Given** admin login, **when** membuka `/admin/produk`, **then** halaman katalog tampil dengan kartu statistik, tabel produk dari mock, dan pagination; user non-admin di-redirect (pola `beforeLoad` sama dengan `routes/_authenticated/admin.tsx`).
2. **Given** kata kunci di search atau filter kategori/status berubah, **then** daftar terfilter dan pagination kembali ke halaman 1.
3. **Given** hasil filter kosong, **then** tampil empty state "tidak ada hasil" dengan aksi reset; **given** data mock kosong, **then** empty state "belum ada produk".
4. **Given** tombol "Tambah Produk", **then** dialog form (nama, SKU, kategori, harga, URL gambar, stok, threshold) tervalidasi zod; submit menambah produk ke state halaman (mock).
5. **Given** tombol "Edit" pada baris, **then** dialog terbuka terisi nilai baris tersebut; submit memperbarui produk (termasuk stok & threshold) di state halaman.
6. Sidebar admin menampilkan item "Produk" aktif di `/admin/produk` dan tetap disabled untuk item lain.
7. Lint, typecheck, test, build lulus.

## 3. Asumsi & Di Luar Scope

- **Asumsi**: mock data ~12 produk kategori florist (Buket, Standing Flower, Bloom Box, Single Stem); bahasa Indonesia; palet warm orange repo (`#FF6B35`, `#FFF3ED`, `#C2410C`); harga dalam Rupiah.
- **Di luar scope**: Export CSV, Import Batch, quick-action stok inline, upload file gambar, backend API, sorting kolom, dark mode.

## 4. Temuan Repo (bukti)

- Guard admin & head meta: `apps/web/src/routes/_authenticated/admin.tsx`.
- Nav item "Produk" sudah ada (disabled): `apps/web/src/features/admin/components/layout/sidebar/admin-nav.tsx` (line 27); tipe `AdminNavItem.to?: "/admin"` perlu dilebarkan.
- Struktur feature: `features/admin/components/*` + `features/admin/pages/*` + test colocated `*.test.tsx` (Vitest + Testing Library, setup `apps/web/vitest.setup.ts`).
- UI kit: `apps/web/src/components/ui/` — button, card, dialog, select, input, label, badge, skeleton, field, textarea tersedia; **table.tsx belum ada**; `@tanstack/react-table` tidak terpasang (tidak ditambahkan).
- Form: `react-hook-form` + `@hookform/resolvers` + `zod` terpasang (`apps/web/package.json`).
- API terverifikasi via context7: `createFileRoute("/_authenticated/admin/produk")` (TanStack Router ^1.170.41); primitif `Table/TableHeader/TableBody/TableRow/TableHead/TableCell` shadcn dengan wrapper `overflow-x-auto`.

## 5. Keputusan Desain & Alternatif yang Ditolak

- **Dipilih**: mock lokal + tabel shadcn sederhana + state di page component (React `useState`/`useMemo`); filter logic diekstrak ke pure function agar mudah dites.
- **Ditolak**: `@tanstack/react-table` (dependency baru, overkill untuk paging client-side sederhana); full-stack langsung (keputusan user: backend menyusul); semua komponen inline di satu file (melanggar pola repo).
- Tipe mock (`AdminProduct`) dibentuk mengarah ke skema `Product` OpenAPI (`packages/shared/src/types.gen.ts`) supaya migrasi ke react-query/API minim gesekan.

## 6. Reuse Decision Table & File Placement Map

| Kebutuhan | Keputusan | Path | Alasan |
|---|---|---|---|
| Button/Dialog/Select/Input/Label/Badge/Card/Skeleton | Reuse | `apps/web/src/components/ui/*` | sudah ada & terpakai di dashboard |
| Primitif tabel | Create | `apps/web/src/components/ui/table.tsx` | belum ada; salin pola shadcn (docs table, base style, tanpa `"use client"`) |
| Guard role admin | Extend (copy pattern) | `apps/web/src/routes/_authenticated/admin/produk.tsx` | pola `beforeLoad` dari `admin.tsx` |
| Nav Produk | Extend | `apps/web/src/features/admin/components/layout/sidebar/admin-nav.tsx` | item sudah terdaftar |
| Tipe & mock produk, filter, format Rupiah | Create | `apps/web/src/features/admin/products/lib/*` | colocation pola repo |
| Komponen UI halaman | Create | `apps/web/src/features/admin/products/components/*` | idem |
| Halaman | Create | `apps/web/src/features/admin/products/pages/admin-products-page.tsx` | mengikuti `features/admin/pages` |

## 7. Task Berurutan

> Perintah verifikasi dijalankan dari root repo kecuali disebut lain.
> Test: `pnpm --filter client-web-delysa-florist exec vitest run <path>`; full: `pnpm --filter client-web-delysa-florist test`; typecheck: `pnpm --filter client-web-delysa-florist build` (build sudah termasuk `tsc --noEmit`); lint: `pnpm -r lint`.

### Task 1 — Tipe, mock data, helper filter/format
- **Tujuan**: sumber data & logika murni sebelum UI.
- **File**:
  - `apps/web/src/features/admin/products/lib/product.types.ts` — `AdminProduct { id: number; name: string; sku: string; category: string; price: number; stock: number; stockUnit: string; minThreshold: number; imageUrl?: string; isPublished: boolean }`; `PRODUCT_CATEGORIES` (const tuple); tipe `ProductFilters { search: string; category: string; stockStatus: "all" | "aman" | "menipis" | "habis" }`; `ProductStockStatus = "aman" | "menipis" | "habis"`.
  - `apps/web/src/features/admin/products/lib/mock-products.ts` — 12 produk florist (stok bervariasi: aman / menipis = stock ≤ minThreshold & > 0 / habis = 0).
  - `apps/web/src/features/admin/products/lib/product-filters.ts` — `getStockStatus(p): ProductStockStatus`, `filterProducts(products, filters): AdminProduct[]`, `paginate(items, page, perPage): { rows, total, totalPages }`, `formatRupiah(value): string` (`Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })`). `filterProducts` melakukan lowercase-match `name`/`sku`/`category`, reset page ditangani pemanggil.
- **Test** (tulis dulu, merah): `product-filters.test.ts` — filter search case-insensitive, filter kategori, filter status habis/menipis, pagination halaman akhir, format Rupiah.
- **Verifikasi**: vitest path di atas hijau.

### Task 2 — Primitif tabel UI
- **Tujuan**: primitif tabel shadcn-style untuk seluruh app.
- **File**: `apps/web/src/components/ui/table.tsx` — ekspor `Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption` (pola shadcn base: container `relative w-full overflow-x-auto`, tabel `w-full caption-bottom text-sm`, `whitespace-nowrap` di head/cell, semua menerima `className` via `cn`). Ikuti gaya file UI lain (function component + export object di akhir, tanpa `"use client"`).
- **Test**: `apps/web/src/components/ui/table.test.tsx` — render tabel dengan header/body, container membungkus `overflow-x-auto`.
- **Verifikasi**: vitest path hijau.

### Task 3 — Kartu statistik & komponen filter
- **Tujuan**: ringkasan katalog dan kontrol filter.
- **File**:
  - `apps/web/src/features/admin/products/components/products-stats-cards.tsx` — props `{ products: AdminProduct[] }`; 3 kartu (Total Produk & jumlah aktif di web; Stok Menipis — `stock > 0 && stock <= minThreshold`; Habis — `stock === 0`) memakai `Card`, ikon `lucide-react`, label teks.
  - `apps/web/src/features/admin/products/components/products-filters.tsx` — props `{ filters, onChange, resultCount, onReset }`; search `Input` (label "Cari nama produk atau SKU…"), dua `Select` (Kategori: Semua + `PRODUCT_CATEGORIES`; Status Stok: Semua/Aman/Menipis/Habis). Perubahan filter memanggil `onChange` dan pemanggil me-reset page ke 1.
- **Test**: render kartu dengan angka benar dari fixture; interaksi search/filter memanggil `onChange` dengan nilai baru (role `searchbox`, accessible name dari label).
- **Verifikasi**: vitest path hijau.

### Task 4 — Tabel produk & pagination
- **File**:
  - `apps/web/src/features/admin/products/components/products-table.tsx` — props `{ products, onEdit }`; kolom: Produk (thumbnail `img` 40×40 rounded + nama + SKU), Kategori, Harga, Stok (`{stock} {stockUnit}` + `Badge` berlabel Aman/Menipis/Habis), Status (`Badge` "Aktif di Web"/"Draf"), Aksi (`Button` size icon "Edit" dengan `aria-label={"Edit produk " + name}` → `onEdit(product)`). Empty state terpisah: `products.length === 0` → "Belum ada produk"; hasil filter kosong → "Tidak ada produk yang cocok" + tombol reset (dilewatkan via prop `hasFilters` + `onReset`).
  - `apps/web/src/features/admin/products/components/products-pagination.tsx` — props `{ page, totalPages, onPageChange, totalItems, perPage }`; teks "Menampilkan x–y dari z produk"; `Button` Prev/Next disabled di ujung; tombol nomor halaman dengan `aria-current="page"`; sembunyikan bila `totalPages <= 1`.
- **Test**: render baris fixture + klik Edit memanggil callback dengan produk yang benar; badge status sesuai stok; Prev disabled di halaman 1; klik halaman 2 memanggil `onPageChange(2)`.
- **Verifikasi**: vitest path hijau.

### Task 5 — Dialog form produk
- **File**: `apps/web/src/features/admin/products/components/product-form-dialog.tsx` — props `{ open, onOpenChange, product?: AdminProduct | null, onSubmit(values): void }`; `react-hook-form` + `zodResolver` dengan `productFormSchema` (didefinisikan di file ini: name 2–100, sku 3–30 uppercase-ish, category enum `PRODUCT_CATEGORIES`, price int ≥ 0, stock int ≥ 0, stockUnit 1–20, minThreshold int ≥ 0, imageUrl string url opsional, isPublished boolean). Mode `product ? "edit" : "create"`; judul & tombol submit berbeda; submit → `onSubmit` → parent menutup dialog. Stok & threshold diedit lewat dialog ini (keputusan user).
- **Test**: buka dialog create — validasi gagal saat kosong (pesan error tampil); isi form → `onSubmit` menerima nilai; mode edit terisi nilai awal.
- **Verifikasi**: vitest path hijau.

### Task 6 — Halaman & route
- **File**:
  - `apps/web/src/features/admin/products/pages/admin-products-page.tsx` — state: `products` (init dari mock), `filters`, `page` (per halaman 8). `useMemo` untuk `filtered = filterProducts(...)` dan `pageData = paginate(...)`; setiap perubahan filter → `setPage(1)`. Submit dialog create: tambah produk dengan `id = max+1`; edit: replace by id. Layout: header halaman (eyebrow, judul "Katalog Produk", deskripsi, `Button` "+ Tambah Produk"), `ProductsStatsCards`, `ProductsFilters`, `Card` berisi `ProductsTable` + `ProductsPagination`, footer catatan kecil.
  - `apps/web/src/routes/_authenticated/admin/produk.tsx` — `createFileRoute("/_authenticated/admin/produk")`: `beforeLoad` role guard `admin` + redirect `roleHome` (copy dari `admin.tsx`), `head` meta "Produk — Admin Delysa Florist", render `AdminProductsPage` (halaman tidak butuh `user`; tanda tangan tanpa prop).
  - `apps/web/src/features/admin/components/layout/sidebar/admin-nav.tsx` — aktifkan item Produk: ubah tipe `to?: string` yang dipakai hanya untuk route admin (literal union `"/admin" | "/admin/produk"`), tambah `to: "/admin/produk"` pada item Produk; logika render tidak berubah.
- **Test**:
  - `admin-products-page.test.tsx`: render dengan mock → kartu & baris tampil; search memfilter (baris berkurang) & kembali ke halaman 1; buka dialog tambah → submit menambah baris baru; edit produk mengubah nilai stok di tabel.
  - `admin-nav.test.tsx` (update): item "Produk" kini berupa link ke `/admin/produk` dan aktif saat pathname cocok; item tanpa `to` tetap disabled.
- **Verifikasi**: vitest path hijau.

### Task 7 — Verifikasi penuh & self-review
- Jalankan berurutan: `pnpm -r lint` → `pnpm --filter client-web-delysa-florist test` (seluruh suite) → `pnpm --filter client-web-delysa-florist build` → (opsional) `pnpm dev` lalu cek manual `/admin/produk` di ~375px, 768px, 1440px: tabel scroll horizontal di mobile, dialog ter-scroll, nav aktif.
- Self-review diff terhadap acceptance criteria; laporkan hasil apa adanya (warning `[MODULE_LEVEL_DIRECTIVE]` pada build dikenal-ada dan boleh).
- Titik commit: satu commit per task (message: `feat(admin): ...`), mis. Task 6 → `feat(admin): halaman katalog produk admin dengan mock data`.

## 8. Rencana Verifikasi per Acceptance Criteria

| AC | Verifikasi |
|---|---|
| 1 | Test render halaman + route guard (pola test `admin.tsx`); manual login admin |
| 2 | Test interaksi filter/reset page di `admin-products-page.test.tsx` |
| 3 | Test empty state dua varian di `products-table.test.tsx` |
| 4–5 | Test dialog create/edit di `product-form-dialog.test.tsx` + integrasi di halaman |
| 6 | Update test `admin-nav.test.tsx` |
| 7 | lint / test / build lulus + cek responsif manual |

## 9. Risiko & Mitigasi

- **Kontrak API berubah nanti** → tipe & schema form dikolokasi di `features/admin/products/lib|components`, pemetaan ke API cukup di satu lapisan saat integrasi.
- **Route `/admin/produk` vs `/admin`** → route index `/admin` tetap di `admin.tsx`; nested route tidak menabrak; guard diduplikasi secara eksplisit (pola repo).
- **Aksesibilitas tabel & dialog** → heading/caption tabel, label form eksplisit, focus dialog otomatis (Dialog Base UI), aria-label aksi baris.
- **Mobile** → wrapper `overflow-x-auto` pada tabel; stat cards grid 1 kolom → 3 kolom (`sm:`).

## 10. Referensi

- context7: `/tanstack/router` (^1.170.41) — "createFileRoute in file-based routing"; `/shadcn-ui/ui` — docs & source `ui/table.tsx` (base style).
- exa: admin-ui.vercel.app "Listing page design"; Adobe Commerce "Data Table pattern"; Byteion UI "Data Table Page" (detail di `docs/research/admin-products-management.md`).

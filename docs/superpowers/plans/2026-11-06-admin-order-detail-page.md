# Rencana Implementasi: Halaman Detail Order Admin

**Tanggal:** 2026-11-06  
**Branch:** `feature/cp-42`  
**Status:** Disetujui oleh user (Fase 3) — siap implementasi

---

## 1. Ringkasan & Tujuan

Membuat halaman detail order admin sebagai route terpisah `/admin/pesanan/$orderId` (mis. `/admin/pesanan/DLF-20241026-8842`) dengan tampilan lengkap sesuai desain Image 1 (semua section: informasi pemesan, lokasi & jadwal antar, instruksi pengantaran, inspeksi bukti transfer, status pemenuhan atelier 4-tahap, komposisi floral, konfirmasi penolakan pembayaran kondisional, total tagihan, jejak audit, kartu ucapan custom), diadaptasi ke konteks admin. Akses lewat tombol "Buka halaman detail" di header drawer detail (sudah ada) dan ikon di setiap baris tabel. Sheet kanan saat klik row tetap ada dan tidak diubah alurnya.

---

## 2. Acceptance Criteria

| # | Kriteria |
|---|----------|
| AC1 | Route `/admin/pesanan/$orderId` tersedia, dilindungi guard admin-only (non-admin dialihkan ke role home). |
| AC2 | Klik baris tabel → ikon "Detail penuh" navigasi ke route detail dengan kode order pada URL. |
| AC3 | Header drawer detail menampilkan tombol "Buka halaman detail" yang navigasi ke route detail. |
| AC4 | Halaman detail render semua section Image 1 yang relevan (disesuaikan admin): header kode+status, informasi pemesan, lokasi & jadwal, instruksi pengantaran, inspeksi bukti transfer, status atelier (stepper 4-tahap), item komposisi floral, konfirmasi penolakan pembayaran (kondisional), total tagihan final, jejak audit, kartu ucapan custom. |
| AC5 | Order tidak ditemukan → halaman menampilkan "Order tidak ditemukan" dengan tombol kembali ke daftar pesanan (tidak crash). |
| AC6 | Semua tes vitest lolos (27 file/130 tes existing + tes baru route + page + drawer + stepper). |
| AC7 | `pnpm build` (vite + tsc) lolos, `prettier --check` pada file yang diubah lolos. |

Tes dalam format Given/When/Then:

- **AC1** Given user bukan admin When buka `/admin/pesanan/DLF-20241026-8842` Then dialihkan ke role home (redirect dipanggil).
- **AC2** Given tabel pesanan When klik ikon detail penuh pada baris order Then navigasi ke `/admin/pesanan/<kode>`.
- **AC3** Given drawer detail terbuka When klik tombol "Buka halaman detail" di header Then navigasi ke route detail order tersebut.
- **AC4** Given order `DLF-20241026-8842` ada When buka route detail Then semua section Image 1 tampil dengan data order.
- **AC5** Given kode order tidak ada When buka route detail Then tampil "Order tidak ditemukan" + tombol kembali.

---

## 3. Asumsi & Di Luar Scope

**Asumsi:**
- Data order tersedia sinkron di order-store shop via `useOrder(code)` (tidak perlu API baru).
- `AdminOrderView` = `OrderRecord` + field dummy admin (enrichment deterministik); cukup untuk tampilan detail.
- URL pakai kode order (string), bukan ID numeric.
- Section "Konfirmasi Penolakan Pembayaran" dan "Kartu Ucapan Custom" diadaptasi ke konteks admin (tombol aksi admin, customNote dari order).
- Verifikasi visual browser (375/768/1440px) dilakukan user manual; agent tidak dapat menjalankan browser.

**Di luar scope:**
- Mengubah alur sheet kanan saat klik row (tetap ada).
- Mengubah `components/ui/table.tsx` (shared).
- Mengubah `packages/shared/**` atau kode shop di luar komponen order yang dipakai ulang.
- Perbaikan bug pre-existing (2 tes auth gagal, format:check legacy CRLF).
- Migrasi data, feature flag, rollout bertahap.

---

## 4. Temuan Repository Ringkas

| Temuan | Path sebagai bukti |
|---|---|
| Stack: TanStack Router v1.170.41, React 19, TanStack Start, Tailwind 4.2.2, vitest 5, pnpm 9 | `apps/web/package.json` |
| Route pesanan dengan guard admin (`beforeLoad`, `context.user.role !== "admin"`) | `apps/web/src/routes/_admin/admin/pesanan.tsx` |
| Route tree admin: `/_admin` → `AdminShell` (sidebar) → `/_admin/admin` → `Outlet` → page | `apps/web/src/routes/_admin/route.tsx`, `admin.tsx` |
| File-based route param: `$orderId.tsx`, `Route.useParams()`, `<Link to="/path/$param" params={{}}>` | diverifikasi via context7 `/tanstack/router` |
| Hook data order: `useOrder(code)` dari order-store shop | `apps/web/src/features/shop/hooks/use-orders.ts:17` |
| Tipe: `OrderRecord` (`shop/types.ts:208`), `AdminOrderView` (`admin/lib/pesanan/admin-order.types.ts:12`) | sudah ada |
| Sheet klik row: `AdminOrderDetailDrawer` + 11 tes lolos | `components/pesanan/admin-order-detail-drawer.tsx` |
| Komponen kartu reusable: `OrderItemsCard`, `OrderPaymentCard`, `OrderStatusBadge`, `OrderStatusTimeline`, `CopyOrderCodeButton` | `features/shop/components/orders/` |
| Tes colocation `*.test.tsx`, vitest + testing-library | `admin-order-detail-drawer.test.tsx` |
| Perintah verifikasi: `pnpm --filter client-web-delysa-florist exec vitest run`, `build`, `format:check` | `apps/web/package.json` |

---

## 5. Keputusan Desain & Alternatif yang Ditolak

| Alternatif | Keputusan | Alasan |
|---|---|---|
| Route terpisah `$orderId.tsx` + halaman penuh per Image 1 | ✅ Terpilih | Konsisten pola route `pesanan.tsx`, URL shareable, sheet tetap ada |
| Ubah drawer menjadi halaman penuh (hapus sheet) | ❌ Ditolak | User ingin sheet kanan tetap saat klik row |
| Fetch via API call backend | ❌ Ditolak | Order tersedia sinkron via `useOrder(code)` |
| Tambah kolom tabel penuh untuk tombol detail | ⚠️ Hati-hati | Tabel baru saja diperbaiki lebar 100%; tambah ikon link kecil, diuji lebar |

---

## 6. Reuse Decision Table

| Kebutuhan | Keputusan | Aset/Path | Alasan |
|---|---|---|---|
| Route detail + guard | Create | `routes/_admin/admin/pesanan/$orderId.tsx` | Pola file-based sama `pesanan.tsx`, belum ada |
| Halaman detail (Image 1) | Create | `features/admin/pages/admin-order-detail-page.tsx` | Baru per Image 1 |
| Data order | Reuse | `useOrder(code)` — `features/shop/hooks/use-orders.ts:17` | Sudah ada, sinkron |
| Tipe order | Reuse | `OrderRecord`, `AdminOrderView` | Sudah ada |
| Sheet klik row | Reuse | `AdminOrderDetailDrawer` | Sudah ada, 11 tes |
| Komponen kartu (items, pembayaran, badge, timeline, salin kode) | Reuse | `features/shop/components/orders/*` | Sudah ada, seragam |
| Jejak audit | Reuse | `OrderStatusTimeline` | Sudah ada |
| Navigasi redirect | Reuse | `Link` dari `@tanstack/react-router` | Pola `admin-nav.tsx`, type-safe params |
| Tombol | Reuse | `Button` (`components/ui/button.tsx`) | Sudah ada |
| Atelier 4-tahap stepper | Create | `components/pesanan/admin-order-atelier-stepper.tsx` | Belum ada, spesifik Image 1 |
| Tombol drawer header + ikon tabel | Ubah | `admin-order-detail-drawer.tsx`, `admin-order-table.tsx` | Tambah minimal |

---

## 7. File Placement Map

| File | Aksi | Tujuan |
|---|---|---|
| `apps/web/src/routes/_admin/admin/pesanan/$orderId.tsx` | Create | Route detail + guard admin + head meta |
| `apps/web/src/routes/_admin/admin/pesanan/$orderId.test.tsx` | Create | Tes route guard & komponen halaman |
| `apps/web/src/features/admin/pages/admin-order-detail-page.tsx` | Create | Halaman detail Image 1 |
| `apps/web/src/features/admin/pages/admin-order-detail-page.test.tsx` | Create | Tes halaman (render, section, not-found, tombol kembali) |
| `apps/web/src/features/admin/components/pesanan/admin-order-atelier-stepper.tsx` | Create | Stepper status atelier 4-tahap |
| `apps/web/src/features/admin/components/pesanan/admin-order-atelier-stepper.test.tsx` | Create | Tes stepper |
| `apps/web/src/features/admin/components/pesanan/admin-order-detail-drawer.tsx` | Ubah | Tambah tombol "Buka halaman detail" di header |
| `apps/web/src/features/admin/components/pesanan/admin-order-detail-drawer.test.tsx` | Ubah | Tes tombol drawer |
| `apps/web/src/features/admin/components/pesanan/admin-order-table.tsx` | Ubah | Ikon link detail penuh per baris (jika lebar tabel aman) |
| `apps/web/src/features/admin/components/pesanan/admin-order-table.test.tsx` | Ubah | Tes ikon detail tabel (jika tabel diubah) |

---

## 8. Task Berurutan

### Task 1: Buat route `$orderId.tsx` dengan guard admin
- **Tujuan:** Route file-based `/admin/pesanan/$orderId` dilindungi guard admin, head meta, render `AdminOrderDetailPage`.
- **File dibuat:** `apps/web/src/routes/_admin/admin/pesanan/$orderId.tsx`
- **Antarmuka:** `createFileRoute("/_admin/admin/pesanan/$orderId")({ beforeLoad, head, component })`; beforeLoad cek `context.user.role !== "admin"` → redirect role home.
- **Test ditulis lebih dulu:** `apps/web/src/routes/_admin/admin/pesanan/$orderId.test.tsx` — given non-admin, when beforeLoad, then redirect dipanggil (pola tes `pesanan.test.tsx` existing).
- **Hasil gagal yang diharapkan:** Tes gagal (file belum ada / route belum dikembalikan component).
- **Langkah implementasi:** Replikasi pola `pesanan.tsx`, ganti path dan component.
- **Verifikasi:** `pnpm --filter client-web-delysa-florist exec vitest run src/routes/_admin` — tes route baru lolos.
- **Titik commit:** `feat(admin): tambah route detail order dengan guard admin`

### Task 2: Buat komponen stepper status atelier
- **Tujuan:** Stepper 4-tahap (1. Menunggu Verifikasi, 2. Sedang Dikerjakan, 3. Dalam Pengantaran, 4. Selesai Terkirim) sesuai Image 1.
- **File dibuat:** `features/admin/components/pesanan/admin-order-atelier-stepper.tsx`, `admin-order-atelier-stepper.test.tsx`
- **Antarmuka:** `AdminOrderAtelierStepper({ status })` menampilkan 4 tahap dengan salah satu aktif berdasarkan `status`.
- **Test ditulis lebih dulu:** Tes render 4 tahap, highlight tahap aktif berdasarkan status.
- **Hasil gagal yang diharapkan:** Tes gagal (komponen belum ada).
- **Langkah implementasi:** Buat komponen dengan 4 langkah, badge status aktif/selesai/belum.
- **Verifikasi:** `vitest run` pada file tes stepper lolos; prettier clean.
- **Titik commit:** `feat(admin): komponen stepper status atelier`

### Task 3: Buat halaman detail order `admin-order-detail-page.tsx`
- **Tujuan:** Halaman detail lengkap per Image 1, pakai `useOrder(code)` via `Route.useParams()`.
- **File dibuat:** `features/admin/pages/admin-order-detail-page.tsx`, `admin-order-detail-page.test.tsx`
- **Antarmuka:** Page baca `orderId` dari params, fetch `useOrder(orderId)`, render section-section Image 1; jika tidak ditemukan tampil "Order tidak ditemukan" + tombol kembali ke `/admin/pesanan`.
- **Test ditulis lebih dulu:** Tes render semua section dengan fixture order, tes not-found, tes tombol kembali.
- **Hasil gagal yang diharapkan:** Tes gagal (page belum ada / section belum render).
- **Langkah implementasi:** Susun section-section, reuse komponen shop (OrderItemsCard, OrderPaymentCard, OrderStatusBadge, OrderStatusTimeline, CopyOrderCodeButton), stepper baru.
- **Verifikasi:** `vitest run src/features/admin` — tes page baru lolos; prettier clean.
- **Titik commit:** `feat(admin): halaman detail order lengkap per Image 1`

### Task 4: Tambah tombol redirect di drawer detail
- **Tujuan:** Header drawer detail menampilkan tombol "Buka halaman detail" navigasi ke route detail.
- **File diubah:** `features/admin/components/pesanan/admin-order-detail-drawer.tsx` (+ test di file existing)
- **Antarmuka:** Tombol di samping judul kode order di drawer, pakai `Link to="/admin/pesanan/$orderId" params={{ orderId: order.code }}`.
- **Test ditulis lebih dulu:** Tes tombol drawer memanggil navigasi (mock Link / spy onNavigate).
- **Hasil gagal yang diharapkan:** Tes gagal (tombol belum ada).
- **Langkah implementasi:** Sisipkan `Link` / tombol di header drawer setelah `OrderStatusBadge`.
- **Verifikasi:** `vitest run` pada tes drawer lolos (12 tes); prettier clean.
- **Titik commit:** `feat(admin): tombol buka halaman detail di drawer`

### Task 5: Tambah ikon link detail di baris tabel
- **Tujuan:** Setiap baris tabel memiliki ikon link "detail penuh" terpisah dari aksi status.
- **File diubah:** `features/admin/components/pesanan/admin-order-table.tsx` (+ test)
- **Antarmuka:** Kolom aksi tambah ikon `Link` ke `/admin/pesanan/$orderId`; pastikan tidak meluber tabel (kolom action sudah w-18%).
- **Test ditulis lebih dulu:** Tes ikon link detail render pada setiap baris.
- **Hasil gagal yang diharapkan:** Tes gagal (ikon belum ada).
- **Langkah implementasi:** Tambah baris aksi ikon detail di `admin-order-columns.tsx` cell action atau render langsung di tabel.
- **Verifikasi:** `vitest run src/features/admin` lolos; prettier clean; build lolos (tabel tidak overflow).
- **Titik commit:** `feat(admin): ikon detail penuh per baris tabel`

### Task 6: Verifikasi akhir & commit gabungan
- **Tujuan:** Pastikan semua tes, build, format lolos sebelum commit akhir.
- **File:** semua file di atas.
- **Verifikasi:** `vitest run src/features/admin src/routes/_admin` (harus 27+ file / 130+ tes), `pnpm build`, `prettier --check` pada semua file yang diubah.
- **Titik commit:** `feat(admin): halaman detail order + tombol redirect (commit gabungan)`

---

## 9. Rencana Verifikasi per Acceptance Criteria

| AC | Perintah verifikasi | Hasil yang diharapkan |
|---|---|---|
| AC1 | `vitest run src/routes/_admin` | Tes guard non-admin redirect lolos |
| AC2 | `vitest run src/features/admin` | Tes ikon detail tabel render lolos |
| AC3 | `vitest run src/features/admin` | Tes tombol drawer navigasi lolos |
| AC4 | `vitest run src/features/admin` | Tes page render semua section lolos |
| AC5 | `vitest run src/features/admin` | Tes not-found + tombol kembali lolos |
| AC6 | `vitest run src/features/admin src/routes/_admin` | Semua tes lolos (27+ file / 130+ tes) |
| AC7 | `pnpm build` + `prettier --check` | Build lolos, format file yang diubah clean |

**UI (browser, dilakukan user manual):** Jalankan `pnpm dev:web`, buka `/admin/pesanan`, klik baris → sheet kanan, klik tombol detail → halaman penuh Image 1; cek 375/768/1440px.

---

## 10. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Order tidak ditemukan di store | Halaman not-found dengan tombol kembali ke daftar (AC5) |
| Tabel overflow setelah tambah ikon detail | Kolom action w-18% sudah ada; uji lebar tabel via build + visual manual |
| Status atelier panjang | Badge `shrink-0` + lebar kolom status w-14%/w-20% |
| `customNote` undefined | Kondisional rendering kartu ucapan |
| Param route type mismatch | Pakai `Route.useParams()` type-safe dari TanStack Router |

---

## 11. Referensi

- **context7:** TanStack Router (`/tanstack/router`) — `createFileRoute`, `$param` file route, `Route.useParams()`, `<Link to="/path/$param" params={{}}>` (diverifikasi, versi repo `^1.170.41`, docs API stabil hingga v1.139).
- **Tidak ada dependency baru.** Semua library sudah terpasang (`@tanstack/react-router`, `react`, `cn`, `lucide-react`, `@base-ui/react`).

---

**Gate selesai.** Siap implementasi. Pilih mode: **per task dengan review** atau **batch inline**?
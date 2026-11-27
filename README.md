# Delysa Florist — E-Commerce Monorepo

Platform e-commerce terintegrasi untuk **Delysa Florist Tasikmalaya** (katalog bunga & buket, keranjang, checkout non-COD BCA/QRIS, upload bukti bayar, manajemen stok atomik, dashboard admin, laporan omzet, dan sinkronisasi real-time).

Spec penuh: `PRD-Delysa-Florist.md`. Proposal akademik: `Capstone Project Delysa Florist.docx`.

## Struktur Monorepo (`pnpm workspaces`, tanpa Turborepo)

```text
apps/web/         TanStack Start + Router + Query + Tailwind v4 + shadcn/ui (:3000)
apps/api/         Laravel 13 headless REST API + Sanctum + SQLite dev (:8000)
packages/shared/  Kontrak tunggal: openapi.yaml + generated types + Zod schemas
.github/          CI job paralel (web, api) + CODEOWNERS
docs/             Spec per fase & rencana implementasi
```

Aturan dependensi: `web → shared ← api` (dilarang cyclic). Kontrak API tunggal: `packages/shared/openapi.yaml`.

## Fitur Utama

- **Storefront & Katalog Pelanggan**: Tema Floral Rose Delysa, kartu produk efek kaca, pencarian berbatas, filter kategori/harga/urutan, halaman koleksi (`/promo`, `/best-sellers`, `/new-arrivals`, `/categories`, `/about`), serta detail produk dengan opsi ukuran & wrapping.
- **Checkout & Pembayaran**: Transaksi database atomik (potong stok otomatis + tolak `409 STOCK_INSUFFICIENT` bila stok kurang + idempotency key anti-dobel), metode Transfer BCA & QRIS, upload bukti pembayaran nyata (`storage/app/public/payment-proofs`), dan pelacakan status pesanan (`/pesanan/$code`).
- **Panel Admin (`/admin`)**:
  - **Dashboard (`/admin`)**: Ringkasan KPI operasional live, antrean pesanan prioritas, dan peringatan stok kritis.
  - **Kelola Produk (`/admin/produk`)**: Tabel produk, filter stok, tambah/edit produk dengan upload foto permanen, hapus produk, dan export CSV.
  - **Kelola Pesanan (`/admin/pesanan`)**: Antrean pesanan, pesanan manual, inspeksi gambar bukti transfer asli, dan transisi status (penolakan/pembatalan otomatis mengembalikan stok ke database).
  - **Laporan Penjualan (`/admin/laporan`)**: Omzet terverifikasi, jumlah transaksi, omzet per kategori, produk terlaris, filter periode (`7d` / `30d` / `all`), dan export CSV.
- **Sinkronisasi Real-Time**: Server-Sent Events (`GET /api/v1/realtime/stream`) + `BroadcastChannel` antar-tab sehingga checkout pelanggan, unggahan bukti bayar, perubahan status admin, dan pembaruan stok langsung tampil otomatis.

## Cara Menjalankan Lokal

Prasyarat: **Node 20+**, **pnpm 9+**, **PHP 8.3+** (direkomendasikan 8.4), dan **Composer**.

### 1. Setup Frontend & Shared Types

```bash
pnpm install
pnpm gen:types
cp apps/web/.env.example apps/web/.env
```

Isi `apps/web/.env` agar terhubung ke API lokal (kosongkan `VITE_API_URL` jika hanya ingin menjalankan mode mock frontend):

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_MOCK_STOREFRONT=false
```

### 2. Setup Backend Laravel (`apps/api`)

```bash
cp apps/api/.env.example apps/api/.env
cd apps/api
composer install
php artisan key:generate
php artisan storage:link
php artisan migrate --seed
cd ..
```

### 3. Jalankan Server

```bash
pnpm dev:web    # TanStack Start → http://localhost:3000
pnpm dev:api    # Laravel 13 API → http://127.0.0.1:8000
# atau jalankan keduanya paralel:
pnpm dev
```

| Layanan | Perintah | URL |
| --- | --- | --- |
| Web (TanStack Start) | `pnpm dev:web` | http://localhost:3000 |
| API (Laravel 13) | `pnpm dev:api` | http://127.0.0.1:8000 (`/api/v1/health`, `/api/v1/products`) |

> Catatan Windows: jika `pnpm dev:api` menampilkan `PHP binary not found`, tambahkan PHP 8.3/8.4 ke `PATH` atau set `PHP_BIN` menunjuk ke `php.exe` (PowerShell: `$env:PHP_BIN="...\php.exe"; pnpm dev:api`).

## Akun Demo (Hasil `php artisan migrate --seed`)

Semua akun seeder memakai password default `password` (bisa diubah via `SEED_USER_PASSWORD` di `apps/api/.env`):

| Role | Email | Halaman Utama |
| --- | --- | --- |
| Admin | `admin@delysa.test` | `/admin` |
| Pemilik Toko | `owner@delysa.test` | `/toko` |
| Pelanggan | `customer@delysa.test` | `/akun` |

## Ringkasan Endpoint API (`/api/v1`)

- **Auth (Sanctum SPA Cookie)**: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`
- **Katalog Publik**: `GET /products`, `GET /products/flash-sale`, `GET /products/best-sellers`, `GET /products/new-arrivals`, `GET /products/by-category`, `GET /products/{slug}`
- **Pesanan & Bukti Bayar**: `GET /orders`, `POST /orders`, `GET /orders/{code}`, `POST /orders/{code}/payment-proof`
- **Admin (`role:admin,store_owner`)**: CRUD `/admin/products`, `GET|POST /admin/orders`, `PATCH /admin/orders/{code}/status`, `GET /admin/reports`
- **Real-Time**: `GET /realtime/stream` (SSE), `GET /realtime/events`

## Pengujian & Verifikasi

```bash
# Frontend & shared
pnpm typecheck
pnpm --filter client-web-delysa-florist build

# Backend (di dalam apps/api)
php vendor/bin/pint --test
php artisan test
```

## Catatan Deployment

- **Frontend (`apps/web`)**: deploy langsung ke **Vercel** dengan `VITE_API_URL` mengarah ke URL API produksi.
- **Backend (`apps/api`)**: deploy ke host PHP 8.3+ (**Railway / Render / Fly.io / VPS**) dengan PostgreSQL/MySQL, storage persisten (S3/R2), serta konfigurasi `CORS_ALLOWED_ORIGINS`, `SANCTUM_STATEFUL_DOMAINS`, `SESSION_SAME_SITE=none`, dan `SESSION_SECURE_COOKIE=true`.

Jangan pernah commit file `.env` atau database lokal.

## CI & Alur Tim

- **CI**: GitHub Actions (`ci.yml`) menjalankan job `web` (`install + typecheck + build`) dan job `api` (`composer validate + test`) secara paralel.
- **Branching**: `feat/web-*`, `feat/api-*`, `chore/shared-*` → PR ke `development` → `staging` → `main`.

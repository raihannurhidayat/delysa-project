# Mock API per-endpoint + TanStack Query Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tiap section (flash-sale, terlaris, terbaru, kategori, katalog) memanggil endpoint-nya sendiri lewat TanStack Query best-practice, dilayani mock frontend per-file, dengan sakelar env ke BE nyata tanpa ubah komponen.

**Architecture:** Komponen → query hooks → endpoint functions → transport terpilih (`MockTransport` bila `VITE_API_URL` kosong, `FetchTransport` bila terisi). Mock registry memetakan endpoint ke fixture JSON + latensi; query keys via factory; `staleTime` 5 mnt khusus katalog.

**Tech Stack:** React 19, `@tanstack/react-query@5.102.0`, native `fetch`, zod v3, pnpm 9.

**Spec:** Desain disetujui user di chat 2026-10-13 (broker-adapter); riset `docs/research/mock-api-tanstack-query.md`; CP-37; kontrak BE `packages/shared/openapi.yaml` (hanya `/products` + `/health` — endpoint per-section adalah usulan FE).

## Global Constraints

- Tanpa dependency baru (tanpa MSW/axios; `redaxios` tidak terverifikasi context7 — pakai native `fetch`).
- Tanpa ubah `packages/shared`, API, skema DB; tanpa ubah visual/komponen UI selain wiring data.
- `import.meta.env` dibaca sekali di modul transport, tidak di komponen.
- Perintah verifikasi hanya dari `apps/web/package.json`: `format`, `format:check`, `exec tsc --noEmit`, `build`.

## Review Focus

- Ganti filter cepat 3x beruntun — tidak ada hasil basi yang menimpa (abort/signal).
- `?demo=error` tetap menampilkan error state, bukan retry 3x yang lama.
- `VITE_API_URL` diisi URL mati — halaman menampilkan error state, bukan hang.
- Refresh di tengah filter katalog — state kembali dari URL, bukan loading ulang aneh.
- Hapus `VITE_API_URL` — kembali ke mock tanpa edit kode.

## 1. Ringkasan & tujuan

Mengganti 2 sync seam (`use-storefront-data`, `use-catalog-data`) dan 2 sumber inline (`STOREFRONT_PRODUCTS`, `products.json` tunggal) dengan lapisan mock API per-endpoint + 5 query hooks, sehingga tiap section seolah hit endpoint sendiri (`/products/flash-sale`, `/best-sellers`, `/new-arrivals`, `/by-category`, `/products?...`) dengan perilaku async nyata (pending/error), siap ganti ke BE via env.

## 2. Acceptance criteria

- Given tiap section dimuat, When network idle, Then data datang via `useQuery` (devtools Query menampilkan key `["products", ...]`), bukan import sync.
- Given filter katalog diubah cepat, When request lama belum selesai, Then tidak ada hasil basi (signal abort).
- Given `?demo=loading|empty|error`, When dibuka, Then state skeleton/empty/error tampil seperti sekarang.
- Given `VITE_API_URL` dikosongkan, When app jalan, Then semua section memakai mock; Given diisi, Then transport fetch dipakai (gagal koneksi → error state, bukan hang).
- Given `tsc`, `format:check`, `build`, When dijalankan, Then exit 0. Given grep `STOREFRONT_PRODUCTS|products.json tunggal|use-storefront-data|use-catalog-data`, Then nol sisa (kecuali histori git).

## 3. Asumsi & di luar scope

- Asumsi: bentuk respons mock = `{items,total}` untuk list, array polos untuk section (kebutuhan pagination FE; BE belum mendefinisikannya — catat gap untuk CP-57). Latensi mock 500ms baca. `retry: 1` untuk query mock. `staleTime` katalog 5 mnt; section ikut global 30s (`router.tsx`). `demo=` dipertahankan di level page (bukan transport).
- Di luar scope: endpoint tulis (semua GET), auth header, MSW, e2e baru, perubahan visual, sinkronisasi kontrak BE.

## 4. Temuan repo ringkas

- `QueryClient` ter-wire (`src/router.tsx:9-11`, stale 30s + SSR integration); nol `useQuery`/`redaxios` dipakai; `VITE_API_URL` terdokumentasi di `.env.example:7` untuk base publik/mock.
- Seam sync: `hooks/use-storefront-data.ts`, `hooks/use-catalog-data.ts` (+ `applyCatalogFilters` murni); sumber: `data/storefront.ts` (`STOREFRONT_PRODUCTS` + data non-produk tetap dipertahankan), `data/catalog.ts` (re-export `mock/products.json`), `mock/products.json`.
- Konsumen: `view/storefront-page.tsx` (5 section), `view/catalog-page.tsx` (+ `?demo=` harness pola `routes/_shop/index.tsx`).

## 5. Keputusan desain dan alternatif yang ditolak

- Dipilih: broker adapter + MockTransport registry + hooks (detail + alasan di chat Fase 3).
- Ditolak: MSW (dep baru), queryFn baca JSON langsung (tak latih async), satu pool + selector (melanggar diversifikasi file).
- Overlap antar fixture JSON disengaja (mirip respons endpoint independen) dan didokumentasikan di tiap file.

## 6. Reuse Decision Table dan File Placement Map

Reuse: `QueryClient`/SSR integration, `catalog-query-schema.ts`, pola `isPending/isError` + `?demo=`, `formatIDR`, `CardProduct`, `ProductCardSkeleton`. Create: `api/{http,mock,endpoints,query-keys}.ts`, `hooks/use-shop-queries.ts`, `mock/products/*.json` (5). Modify: 2 view, `.env.example`. Delete: `mock/products.json`, `STOREFRONT_PRODUCTS` (sisa `storefront.ts` tetap), 2 seam lama. (Tabel penuh di chat Fase 3.)

## 7. Task berurutan

### Task 1: Fixture per endpoint

**Files:**
- Create: `apps/web/src/mock/products/flash-sale.json`, `best-sellers.json`, `new-arrivals.json`, `by-category.json`, `catalog.json`
- Delete: `apps/web/src/mock/products.json` (di task ini, setelah isi dipindah)

**Interfaces:**
- Consumes: isi `mock/products.json` lama (24 item) sebagai sumber salin.
- Produces: 5 JSON valid; tiap entri `UnifiedProduct`; `flash-sale.json` = 5 item flag promo, `best-sellers.json` = 8 item `sold` tertinggi, `new-arrivals.json` = item `isNew`, `by-category.json` = 24 item terkategorikan, `catalog.json` = 24 item penuh. Header komentar dilarang di JSON — tulis satu baris `"note"`? TIDAK (kontrak bersih); dokumentasikan overlap di plan/task ini saja.

- [ ] **Step 1: Tulis 5 JSON** (salin entri verbatim dari file lama; tanpa ubah nilai).
- [ ] **Step 2: Verifikasi validitas + hitungan.** Run: `pnpm --filter client-web-delysa-florist exec prettier --check "src/mock/products/*.json"` lalu dari root `node --input-type=module -e "import fs from 'node:fs';for(const f of ['flash-sale','best-sellers','new-arrivals','by-category','catalog']){const j=JSON.parse(fs.readFileSync('apps/web/src/mock/products/'+f+'.json','utf8'));console.log(f,j.length)}"`. Expected: exit 0; hitungan 5/8/isNew/24/24.
- [ ] **Step 3: Hapus file lama + commit.** Run: `git rm apps/web/src/mock/products.json` (gagalkan task bila file masih diimport). Lalu `git add` + `git commit -m "feat(mock-api): split product fixtures per endpoint"`.

### Task 2: Transport (`http.ts` + `mock.ts`)

**Files:**
- Create: `apps/web/src/features/shop/api/http.ts`, `apps/web/src/features/shop/api/mock.ts`

**Interfaces:**
- Consumes: `VITE_API_URL` (dibaca sekali di sini).
- Produces: `class ApiError extends Error { status: number }`; `apiFetch<T>(path: string, signal?: AbortSignal) => Promise<T>` (baseURL + `AbortSignal.timeout(10_000)`, throw `ApiError` bila `!response.ok`); `mockDelay(ms: number, signal?: AbortSignal) => Promise<void>` (reject `DOMException AbortError` bila di-abort); `USE_MOCK: boolean` (`!import.meta.env.VITE_API_URL`).

- [ ] **Step 1: Tulis kedua modul** (tanpa import komponen; tanpa dep baru).
- [ ] **Step 2: Verifikasi.** Run: `tsc --noEmit` + `prettier --check` kedua file. Expected: exit 0.
- [ ] **Step 3: Commit.** `git commit -m "feat(mock-api): add http transport and mock helpers"`.

### Task 3: Endpoint + query keys

**Files:**
- Create: `apps/web/src/features/shop/api/endpoints.ts`, `apps/web/src/features/shop/api/query-keys.ts`

**Interfaces:**
- Consumes: Task 2, fixture Task 1, tipe `UnifiedProduct`/`CatalogQuery`/`CatalogResult`.
- Produces: `getFlashSaleProducts(signal?)`, `getBestSellers(signal?)`, `getNewArrivals(signal?)`, `getProductsByCategory(category, signal?)`, `getProducts(query, signal?)`, `getCategoryCounts(query, signal?)` — masing-masing: bila `USE_MOCK` baca fixture + `mockDelay(500, signal)` (+ filter/sort/paginasi/count via `applyCatalogFilters`+`countCatalogByCategory` yang DIPINDAH verbatim dari `use-catalog-data.ts` ke `api/mock.ts` sebagai helper internal, tidak diekspor), bila real → `apiFetch` ke path kontrak (`/products/flash-sale`, dst; list → `/products?search=&category=&page=`); `productQueries = { all: ["products"], flashSale: () => [...all, "flash-sale"], bestSellers, newArrivals, byCategory: (c) => [...all, "by-category", c], filtered: (q) => [...all, "list", q], counts: (q) => [...all, "counts", q] }` (semua variabel queryFn masuk key).

- [ ] **Step 1: Tulis endpoint + keys** (bentuk respons: section → `UnifiedProduct[]`; list → `{items, total}`; total = `applyCatalogFilters(...).total`, pageCount dihitung pemanggil seperti sekarang).
- [ ] **Step 2: Verifikasi.** `tsc` + `prettier --check`. Expected: exit 0.
- [ ] **Step 3: Commit.** `git commit -m "feat(mock-api): add product endpoints and query keys"`.

### Task 4: Query hooks

**Files:**
- Create: `apps/web/src/features/shop/hooks/use-shop-queries.ts`

**Interfaces:**
- Consumes: Task 3.
- Produces: `useFlashSaleProducts()`, `useBestSellersProducts()`, `useNewArrivalsProducts()`, `useCategoryProducts(category: string)`, `useProducts(query: CatalogQuery)` — masing-masing `useQuery({ queryKey, queryFn: ({signal}) => endpoint(..., signal), staleTime: 5*60_000 (hanya useProducts; sisanya default global), placeholderData: keepPreviousData (hanya useProducts), retry: 1 })`. `useProducts` memanggil dua query (list + counts) dan mengembalikan gabungan `{ items, total, counts, isPending, isError }` agar signature ke page stabil. Return langsung hasil `useQuery` untuk 4 hook section (pemanggil pakai `isPending/isError/data` yang sudah dikenal).

- [ ] **Step 1: Tulis 5 hooks** (tanpa logika filter di sini).
- [ ] **Step 2: Verifikasi.** `tsc` + `prettier --check`. Expected: exit 0.
- [ ] **Step 3: Commit.** `git commit -m "feat(mock-api): add product query hooks"`.

### Task 5: Migrasi storefront + hapus seam lama

**Files:**
- Modify: `apps/web/src/features/shop/view/storefront-page.tsx` (5 section → hooks; `demo` branching dipertahankan; hooks dipanggil tanpa syarat, hasil diabaikan saat `demo` set)
- Modify: `apps/web/src/features/shop/data/storefront.ts` (hapus `STOREFRONT_PRODUCTS`; TRUST/FAQS/CATEGORIES/HERO tetap)
- Delete: `apps/web/src/features/shop/hooks/use-storefront-data.ts`, `apps/web/src/features/shop/hooks/use-catalog-data.ts` (setelah katalog migrasi? URUTAN: hapus keduanya di Task 6 agar tak ada tree patah di tengah — Task ini hanya migrasi storefront + hapus `use-storefront-data.ts`)

**Interfaces:**
- Consumes: Task 4.
- Produces: section render `data ?? []`, `isPending` → skeleton yang sudah ada, `isError` → pesan yang sudah ada.

- [ ] **Step 1: Ganti sumber data 5 section** (tanpa ubah JSX selain prop data).
- [ ] **Step 2: Verifikasi.** `tsc` + `prettier --check` + grep nol `use-storefront-data|STOREFRONT_PRODUCTS`. Expected: exit 0 + nol.
- [ ] **Step 3: Commit.** `git commit -m "feat(mock-api): migrate storefront sections to query hooks"`.

### Task 6: Migrasi katalog + hapus sisa lama

**Files:**
- Modify: `apps/web/src/features/shop/view/catalog-page.tsx` (`useCatalogData` → `useProducts` + `getCategoryCounts` via hook; `demo` branching dipertahankan)
- Modify: `apps/web/src/features/shop/data/catalog.ts` (hapus re-export `CATALOG_PRODUCTS`; pertahankan `CATALOG_CATEGORIES` + `PRICE_PRESETS`)
- Delete: `apps/web/src/features/shop/hooks/use-catalog-data.ts`

**Interfaces:**
- Consumes: Task 3–4.

- [ ] **Step 1: Ganti sumber data katalog** (`useProducts` + `getCategoryCounts`; `pageCount` dihitung di page via `Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE))` seperti logika lama).
- [ ] **Step 2: Verifikasi.** `tsc` + `prettier --check` + grep nol `use-catalog-data|CATALOG_PRODUCTS|mock/products.json"|from "~/mock/products.json"`. Expected: exit 0 + nol.
- [ ] **Step 3: Commit.** `git commit -m "feat(mock-api): migrate catalog to query hooks"`.

### Task 7: Env + verifikasi akhir

**Files:**
- Modify: `apps/web/.env.example` (kosongkan default `VITE_API_URL` + komentar: kosong = mock, isi = BE nyata)

**Interfaces:** —

- [ ] **Step 1: Edit `.env.example`.**
- [ ] **Step 2: Verifikasi penuh.** Run berurutan: `format:check`, `tsc --noEmit`, `build` (paket `client-web-delysa-florist`). Expected: exit 0 semua.
- [ ] **Step 3: Uji perilaku** (dev server): `/` 5 section terisi; `/katalog` filter/search/pagination; `?demo=loading|empty|error` di kedua page; `?page=abc` fallback. Expected: semua lolos, catat yang tidak.
- [ ] **Step 4: Commit.** `git commit -m "chore(mock-api): default to mock transport via env"`.

## 8. Rencana verifikasi per acceptance criteria

| AC (§2) | Verifikasi |
|---|---|
| Query per section (devtools) | dev server + React Query devtools/penanda `isFetching`; `grep useQuery` di hooks |
| Abort tanpa hasil basi | Task 3 (`signal` di mock+fetch) + uji manual filter cepat |
| `?demo=` 3 state | Task 5–7, uji manual kedua page |
| Sakelar env dua arah | Task 7, uji URL mati → error state |
| Toolchain hijau | Task 7 Step 2 |
| Nol sisa seam lama | grep di Task 5–6 |

Catatan jujur: tanpa unit-test runner (seperti rencana katalog) — verifikasi = perilaku manual + `tsc` + `format:check` + `build`.

## 9. Risiko & mitigasi

- **Drift kontrak** (endpoint per-section + `{items,total}` belum di openapi): mitigasi tipe FE + catatan sync CP-57/CP-14; bukan scope.
- **Duplikasi fixture**: disengaja, didokumentasikan; bila item berubah, ubah di semua file terkait (catat di review).
- **`demo=` vs query asli**: hooks selalu dipanggil (Rules of Hooks), hasil diabaikan saat demo — tentukan di Task 5/6.
- **Vite inline env**: baca sekali di transport (riset [1]); jangan baca di komponen.

## 10. Referensi

- context7 `/tanstack/query` (v5; terpasang 5.102.0): queryFn context+signal, key factory exhaustive-deps, throw-on-error, retry default 3x, stale/gcTime, placeholderData.
- tanstack.com/query v5: queries states, query-functions, suspense.
- Riset: `docs/research/mock-api-tanstack-query.md` (sumber [1]–[8]).
- Repo: `src/router.tsx:9-11`, `packages/shared/openapi.yaml:28-47`, `packages/shared/src/schemas.ts:15-19`, `routes/_shop/index.tsx:8-22`, PRD-FE aturan keras, CP-37.

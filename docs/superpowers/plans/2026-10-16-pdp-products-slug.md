# [M3][FE] S-03 PDP /products/$slug — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Klik kartu produk di mana pun mengarah ke `/products/$slug` dengan PDP penuh Image 1 (galeri, varian ukuran/wrapping, kartu ucapan, qty+ATC, drawer mini-cart, tab, review, terkait) memakai mock-only.

**Architecture:** Route tipis `routes/_shop/products.$slug.tsx` (loader `ensureQueryData` + `throw notFound()`) → view `features/shop/view/product-detail-page.tsx` → modul `features/shop/components/product/*` di atas seam data `api/endpoints.getProductBySlug` + `hooks/useProductDetail` + `hooks/useMiniCart` (localStorage). Varian/wrapping adalah seleksi lokal yang mengubah harga/galeri tanpa BE.

**Tech Stack:** React 19, TanStack Router 1.170.41 (`$slug`, loader, `notFoundComponent`), TanStack Query 5.102.0 (`queryOptions`, `ensureQueryData`, `useSuspenseQuery`, `keepPreviousData`, `retry:1`), Tailwind v4, Base UI 1.8.0 (Dialog, Drawer, Tabs, Accordion via `ui/*`), Embla carousel via `ui/carousel.tsx`, zod 3.23.8, pnpm 9.

**Spec:** Linear CP-35 (`[M3][FE] S-03 PDP /products/$slug`), `docs/research/fe/shop.md §S-03`, `docs/research/fe/route-map.md §1-2`, PRD-FE FE-2 + slot review FE-4, Image 1 chat (sumber visual), riset `docs/research/pdp-products-slug.md`.

## Global Constraints

- Semua tipe response/request API dari `@delysa/shared` bila sudah ada — dilarang tipe API lokal duplikat (PRD-FE aturan keras). PDP detail belum ada di `packages/shared/openapi.yaml` — maka tipe PDP adalah tipe FE lokal di `features/shop/types.ts`, kontrak BE ditulis "tidak terverifikasi".
- Validasi pakai zod; slug `$slug` string non-kosong; qty `z.number().int().min(1).max(stok)`; kartu ucapan `z.string().max(200)`.
- File route dilarang `export` komponen untuk `component/errorComponent/notFoundComponent` (aturan code-split PRD-FE). Route file hanya `createFileRoute` + import view.
- Tidak ada dependency baru; `@base-ui/react/drawer` + `/tabs` sudah termasuk di 1.8.0 terpasang — hanya tambah wrapper tipis `ui/drawer.tsx`, `ui/tabs.tsx` meniru `ui/dialog.tsx`, `ui/accordion.tsx`.
- Tidak menyentuh `apps/api/`, `packages/shared/openapi.yaml`, `routeTree.gen.ts` (generated).
- Perintah verifikasi hanya dari `apps/web/package.json`: `format`, `format:check`, `tsc --noEmit` (via `pnpm --filter client-web-delysa-florist exec tsc --noEmit`), `build` (`vite build && tsc --noEmit`), `test:e2e` (playwright, bila disentuh).

## Review Focus

- Ketik slug tak ada (`/products/slug-ngawur-xyz`) — tampil `NotFound` ("Rangkaian yang Anda Cari Tidak Ditemukan"), bukan crash/error boundary mentah.
- Buka PDP stok-0 via URL langsung — halaman sukses + tombol nonaktif ("Stok Habis"), bukan 404.
- Ganti slug cepat (klik terkait berturut-turut) — tidak ada flash data produk lama yang salah harga/varian (placeholder data + abort signal).
- Qty melebihi stok (ketik manual / klik + cepat) — qty di-clamp ke max stok, ATC disabled saat stok-0, pesan jelas.
- Kartu ucapan 201 char / tempel teks panjang — ditolak di client dengan counter 200 + pesan, tidak terkirim.

## 1. Ringkasan & tujuan

Membangun PDP `/products/$slug` penuh Image 1 tahap mock-only: breadcrumb Home > Shop > nama produk; galeri utama + 4-6 thumbs + badge (Tersedia Hari Ini, Best Seller, Foto Asli Atelier); info (eyebrow edisi, rating 5.0 + 348 Ulasan link, nama, harga + coret + Hemat, stok live "Sisa 4 Buket Hari Ini"); varian Ukuran (Standard/Grand Luxury/Imperial) + Wrapping (Onyx/Cream/Blush) sebagai button-card; textarea kartu ucapan 0/200; qty stepper + TAMBAH KE KERANJANG + wishlist + Beli Langsung Sekarang; trust 2x2 (Same-Day, Garansi, Transfer BCA, CS); tab Deskripsi & Perawatan / Spesifikasi & Dimensi / Jadwal & Area (desktop Tabs, mobile Accordion, satu konten); ulasan 4.9 + distribusi bar + sentimen + filter chips + sort + 2 ulasan verified + Tulis Ulasan (visual-only, auth+pernah-beli); "Lengkapi Momen Spesial Anda" 4 kartu terkait + "Lihat Semua Koleksi Wisuda"; strip "Terakhir Dilihat"; drawer kanan "Berhasil Ditambahkan" (thumb, varian, qty, subtotal, estimasi ongkir GRATIS, total, Lanjut Belanja / Lihat Keranjang & Checkout); refactor `CardProduct` alert→`Link` sehingga klik kartu redirect. 5-state penuh: loading skeleton, empty/slug-tak-ada→NotFound, error+retry, success, disabled (stepper cap + tombol nonaktif).

## 2. Acceptance criteria

- Given kartu di katalog/storefront/flash-sale diklik (atau Enter/Space saat fokus), When navigasi terjadi, Then URL `/products/{slug}` terbuka, preload intent aktif, tidak ada `window.alert`.
- Given `/products/{slug-valid}` dibuka, When data mock termuat, Then tampil breadcrumb, galeri + thumbs, nama, rating + jumlah ulasan, harga + coret + Hemat %, stok live, varian terpilih default (Grand Luxury), kartu ucapan counter, qty=1, ATC + Beli Langsung + wishlist, trust badges, tab, ulasan, terkait, footer atelier.
- Given varian ukuran/wrapping dipilih, When diklik, Then harga total, label varian, dan (bila ada) gambar galeri terupdate dalam 1 klik tanpa tombol Apply; opsi tak tersedia tetap terlihat tapi `aria-disabled` (tidak hidden).
- Given qty diubah (+/- atau ketik), When melebihi stok, Then di-clamp ke max stok; stok-0 → stepper + ATC + Beli disabled dengan label "Stok Habis".
- Given kartu ucapan diisi, When >200 char, Then input ditolak/counter merah + pesan "Maks. 200 karakter"; 200 char lolos.
- Given TAMBAH KE KERANJANG diklik valid, When sukses, Then drawer kanan "Berhasil Ditambahkan" terbuka (fokus trap, Esc/backdrop menutup), item tersimpan localStorage, subtotal + ongkir + total benar, tombol Lanjut Belanja menutup, Lihat Keranjang & Checkout navigasi (tahap ini ke drawer/cart placeholder, tidak 404).
- Given slug tak ada, When dibuka, Then `NotFound` per-route (bukan halaman kosong); Given fetch gagal (demo=error / ApiError non-404), When terjadi, Then error card + "Coba lagi" (invalidate query).
- Given `tsc --noEmit`, `format:check`, `build`, When dijalankan, Then semua exit 0; Given layar 360px + desktop 1280px, When dibuka, Then tidak ada horizontal scroll, galeri swipe/dots mobile, sticky ATC mobile muncul saat ATC utama out-of-view.
- Given SEO, When view-source/meta dicek, Then title/deskripsi/og:image per produk via `seo()` + `head()` route terisi dari data mock.

## 3. Asumsi & di luar scope

- Asumsi dikunci user (Fase 0): scope penuh Image 1; penempatan ikuti codebase (`routes/_shop/products.$slug.tsx` + `features/shop/*`, bukan `features/catalog/*` teks lama Linear); mock-only (tambah fixture detail + `getProductBySlug` lookup pool, tanpa ubah `openapi.yaml`); cart = mini-cart lokal localStorage + drawer (bukan full `/cart` S-04).
- Asumsi teknis: `PAGE detail staleTime 5mnt` mengikuti `useProducts`; `retry:1`; `MOCK_LATENCY_MS=500` dipertahankan agar skeleton terlatih; harga varian = delta lokal di fixture (bukan kalkulasi BE); review agregat statis mock (tombol Tulis Ulasan visual-only, guard auth+pernah-beli hanya indikasi); "Beli Langsung Sekarang" tahap ini = tambah ke mini-cart + buka drawer (bukan ke `/checkout` yang belum ada).
- Di luar scope: BE `GET /products/{slug}` + OpenAPI + phpunit (tandai tidak terverifikasi); route `/cart`, `/checkout`, `/orders/*`; auth guard review submit; upload foto review; SEO lanjutan (canonical/robots/JSON-LD Product — hanya meta dasar `seo()`); e2e baru (kecuali bila murah, reuse harness `?demo=`); migrasi data; feature flag; dark mode khusus PDP (ikuti token existing).
- Penyimpangan TDD sadar (ikuti preseden `2026-10-13-katalog-cp37.md §8`): repo web tanpa unit-test runner (hanya `test:e2e` Playwright, `tests/` kosong) — "test ditulis dulu" diganti verifikasi `tsc` + `prettier` + checklist manual dev-server per task + `?demo=` harness. Dicatat eksplisit di tiap task.

## 4. Temuan repo ringkas

- Stack: React 19, `@tanstack/react-start@1.168.60`, `router@1.170.41`, `react-query@5.102.0`, Tailwind `4.2.2`, `@base-ui/react@1.8.0` (termasuk `drawer/`, `tabs/` di `apps/web/node_modules/@base-ui/react`), `embla-carousel-react@8.6.0`, `lucide-react@1.53.0`, `zod@3.23.8`, pnpm 9, alias `~/` → `src` (bukti: `apps/web/package.json`).
- Struktur: `routes/_shop/` file-based flat (`route.tsx` layout persisten header/footer, `katalog.tsx` + `validateSearch` zod, `index.tsx` + `?demo=` harness) + `features/shop/{api/{endpoints.ts,mock.ts,http.ts,query-keys.ts},hooks/use-shop-queries.ts,components/{card-product.tsx,catalog/*,storefront/*},view/{catalog-page.tsx,storefront-page.tsx},types.ts,data/{catalog.ts,storefront.ts},lib/format.ts,schemas/catalog-query-schema.ts}` + `components/ui/*` (button, badge, card, dialog, carousel, accordion, textarea, breadcrumb, separator, dsb., tanpa `drawer.tsx`/`tabs.tsx`) + `utils/seo.ts` + `router.tsx` (queryClient + `defaultPreload:"intent"` + SSR integration).
- Acuan pola: `routes/_shop/katalog.tsx:1-15` (route tipis + `validateSearch`), `routes/_shop/index.tsx:8-22` (harness demo), `features/shop/api/endpoints.ts:22-99` (mock-vs-BE switch via `isMockMode()`), `api/mock.ts:22-28` (registry fixture per-endpoint) + `mockGet` 404 `ApiError`, `api/query-keys.ts:7-18` (factory exhaustive-deps), `hooks/use-shop-queries.ts:18-71` (`retry:1`, `staleTime 5mnt`, `keepPreviousData`), `components/card-product.tsx:25-41` (alert sementara → wajib jadi `Link`), `components/catalog/catalog-grid.tsx:64-70` + `storefront/product-rail.tsx:85-89` + `storefront/flash-sale-section.tsx:137-145` (3 pemanggil CardProduct), `view/catalog-page.tsx:56-238` (URL state + 5-state + breadcrumb + trust), `components/ui/{dialog.tsx:1-157,carousel.tsx:1-240,accordion.tsx:1-77}`, `components/NotFound.tsx:1-54`, `utils/seo.ts:1-33`.
- `ui/` ada: accordion, badge, button, card, carousel, dialog, dropdown-menu, field, input-group, input, label, select, separator, textarea, toast, breadcrumb — tanpa drawer/tabs.
- Kontrak: `packages/shared/openapi.yaml:28-47` hanya `GET /products` list (tanpa detail by-slug) — alasan mock-only + tipe PDP lokal.
- Konvensi: PRD-FE §4 (tipe shared, zod, no-export route component, baseURL env, `lib/auth.ts` server-only), `route-map.md:20,43,45` (flat-titik satu gaya, route tipis), `docs/superpowers/plans/2026-10-13-katalog-cp37.md` (precedent plan + deviasi TDD).

## 5. Keputusan desain dan alternatif yang ditolak

- **Dipilih A — Loader prefetch + useSuspenseQuery + notFoundComponent.** `loader: ({ params, context }) => context.queryClient.ensureQueryData(productDetailQuery(slug))`; komponen `useSuspenseQuery`; slug tak ada (`ApiError 404`) → `throw notFound()` → `notFoundComponent` reuse `NotFound`. Didukung riset `docs/research/pdp-products-slug.md §2a-3a` + contoh resmi `posts.$postId.tsx` identik. Alasan: SEO slug (meta dari `loaderData`), LCP (prefetch + preload intent yang sudah `router.tsx:16`), konsistensi seam `api/*`, 5-state Query gratis. Varian/wrapping/qty/kartu-ucapan sebagai state lokal di view (bukan URL), harga resolve murni `resolveVariantPrice`.
- **Ditolak B — Client-only useQuery tanpa loader.** Lebih sederhana dan konsisten S-01/S-02, tapi tanpa SSR prefetch → meta SEO telat + waterfall param→fetch. Disimpan sebagai fallback bila loader SSR terbukti rumit saat Task 3 (satu baris ganti, tanpa ubah komponen karena seam `useProductDetail` sama).
- **Ditolak C — Loader sync mock tanpa React Query.** Nol boilerplate tapi merusak seam (`endpoints.ts`/`query-keys.ts`), 5-state manual, evolusi BE memecah pemanggil. Gagal deletion test codebase-design (kompleksitas menyebar ke caller).
- **Drawer:** Bungkus `ui/drawer.tsx` dari `@base-ui/react/drawer` (kanan, `modal`, `swipeDirection="right"`), bukan `Dialog` tengah, bukan lib baru. Dibenarkan: tak ada padanan drawer; `dialog.tsx` jadi template.
- **Tabs:** Tambah `ui/tabs.tsx` tipis dari `@base-ui/react/tabs` untuk tab desktop; mobile pakai `Accordion` existing, satu sumber konten. Dibenarkan: pola PDP standar (Baymard/Shopify); alternatif "accordion saja" ditolak karena Image 1 eksplisit tab 3 kolom.
- **Galeri:** Reuse `ui/carousel.tsx` untuk hero + thumbs sebagai `button` row (bukan nested carousel). Alternatif "carousel ganda sinkron" ditolak (kompleks, a11y sulit).
- **Mini-cart:** Hook `useMiniCart` + storage adapter localStorage key `delysa:mini-cart:v1` (`{ slug, sizeId, wrapId, qty, note }`), tanpa Context global (YAGNI — drawer + PDP saja yang butuh). Evolusi ke S-04 tanpa ubah PDP (ganti adapter).
- Evolusi BE (tanpa dikerjakan kini): tambah `GET /products/{slug}` di `openapi.yaml` + `gen:types`, ganti isi `getProductBySlug` dari `mockGet`→`apiFetch`, biarkan `queryKey`/`hook`/`komponen` tidak berubah.

## 6. Reuse Decision Table dan File Placement Map

### Reuse Decision Table

| Kebutuhan | Keputusan | Aset/Path | Alasan |
|---|---|---|---|
| Tombol, badge, card, separator, breadcrumb, input, textarea, select, accordion | **Reuse** | `apps/web/src/components/ui/{button.tsx,badge.tsx,card.tsx,separator.tsx,breadcrumb.tsx,input.tsx,textarea.tsx,accordion.tsx}` | Design system terkunci; cukup untuk varian-card, harga, kartu ucapan, tab-mobile, breadcrumb |
| Dialog pattern untuk wrapper drawer/tabs | **Reuse (pola)** | `apps/web/src/components/ui/dialog.tsx:1-157` | Template wrapper Base UI → `drawer.tsx`/`tabs.tsx` |
| Carousel galeri | **Reuse** | `apps/web/src/components/ui/carousel.tsx:1-240` | Sudah embla + keyboard + region role; thumbs cukup button |
| Kartu terkait + skeleton | **Reuse** | `apps/web/src/features/shop/components/card-product.tsx` (+ `ProductCardSkeleton`) | 4 kartu "Lengkapi Momen" + strip terakhir-dilihat; wajib refactor alert→Link dahulu |
| Breadcrumb, trust chips, empty/error card | **Reuse (pola)** | `apps/web/src/features/shop/view/catalog-page.tsx:76-100,107-153,214-235` | Struktur breadcrumb + error `role="alert"` + trust grid ditiru |
| Format harga/terjual | **Reuse** | `apps/web/src/features/shop/lib/format.ts` (`formatIDR`, `formatSold`) | Konsisten Rp + "1,2rb" |
| Data fetching seam + query keys + http + mock registry | **Extend** | `apps/web/src/features/shop/api/{endpoints.ts,mock.ts,query-keys.ts,http.ts}`, `apps/web/src/features/shop/hooks/use-shop-queries.ts` | Tambah `detail(slug)` + `getProductBySlug` + `useProductDetail`; tidak ubah existing |
| Pool katalog + kategori | **Extend** | `apps/web/src/mock/products/catalog.json`, `apps/web/src/features/shop/data/catalog.ts` | Sumber slug lookup + terkait `getProductsByCategory` existing |
| 404 global + SEO util + router context | **Reuse** | `apps/web/src/components/NotFound.tsx`, `apps/web/src/utils/seo.ts`, `apps/web/src/router.tsx:8-24` | `notFoundComponent` + `head()` meta + `queryClient` + preload intent |
| Stepper qty | **Create** | `apps/web/src/features/shop/components/product/quantity-stepper.tsx` | Tidak ada padanan; interface kecil `({ value, max, onChange })` |
| Galeri PDP | **Create** | `apps/web/src/features/shop/components/product/product-gallery.tsx` | Tidak ada padanan PDP; ikuti pola `flash-sale-section.tsx` + `carousel.tsx` |
| Info harga/stok/rating | **Create** | `.../product/product-info.tsx` | Tidak ada padanan; props `detail + selectedVariant` |
| Varian ukuran/wrapping | **Create** | `.../product/variant-selector.tsx` | Tidak ada padanan; button-card (Baymard), bukan dropdown |
| Kartu ucapan 200 char | **Create** | `.../product/gift-note-field.tsx` | Tidak ada padanan; `Textarea` + counter + zod max 200 |
| ATC bar + wishlist + beli | **Create** | `.../product/purchase-bar.tsx` | Tidak ada padanan; qty + ATC + beli + hati |
| Tab/accordion deskripsi | **Create** | `.../product/product-tabs.tsx` | Tidak ada padanan; konsumsi `ui/tabs` + `ui/accordion` satu konten |
| Review agregat + list + filter | **Create** | `.../product/review-summary.tsx`, `.../product/review-list.tsx` | Tidak ada padanan; distribusi bar + chips (Image 1) |
| Related rail | **Create** | `.../product/related-rail.tsx` | Tidak ada padanan; grid reuse `CardProduct` (bukan duplikat `ProductRail`) |
| Drawer mini-cart | **Create** | `.../product/mini-cart-drawer.tsx` + `apps/web/src/components/ui/drawer.tsx` | Tidak ada padanan drawer; Base UI Drawer tersedia 1.8.0 |
| Tabs wrapper | **Create** | `apps/web/src/components/ui/tabs.tsx` | Tidak ada padanan; tiru `accordion.tsx` |
| View PDP + route | **Create** | `apps/web/src/features/shop/view/product-detail-page.tsx`, `apps/web/src/routes/_shop/products.$slug.tsx` | Ikuti pola `view/catalog-page.tsx` + `routes/_shop/katalog.tsx` (route tipis) |
| Tipe PDP + fixture + storage | **Create/Extend** | `apps/web/src/features/shop/types.ts` (extend), `apps/web/src/mock/products/product-detail.json`, `apps/web/src/features/shop/hooks/use-mini-cart.ts`, `apps/web/src/features/shop/lib/mini-cart-storage.ts`, `apps/web/src/features/shop/lib/product-detail.ts` (resolve harga) | Tidak ada padanan detail kaya (galeri multi, varian, review); duplikasi fixture disengaja seperti `mock.ts:22-28` |

### File Placement Map

- `apps/web/src/routes/_shop/products.$slug.tsx` — route tipis: `createFileRoute('/_shop/products/$slug')` + loader + head + notFoundComponent + view. Tujuan: seam routing.
- `apps/web/src/features/shop/view/product-detail-page.tsx` — komposisi PDP + state varian/qty/note/drawer + 5-state + SEO sections. Tujuan: orkestrasi.
- `apps/web/src/features/shop/types.ts` (modify) — tambah `ProductSizeOption`, `ProductWrapOption`, `ProductDetail`, `MiniCartLine`. Tujuan: kontrak FE lokal.
- `apps/web/src/mock/products/product-detail.json` — fixture kaya per slug (galeri, varian, deskripsi, review). Tujuan: mock detail.
- `apps/web/src/features/shop/api/mock.ts` (modify) — register `/products/detail` pool. Tujuan: registry konsisten.
- `apps/web/src/features/shop/api/endpoints.ts` (modify) — tambah `getProductBySlug(slug, signal)`. Tujuan: seam fetch.
- `apps/web/src/features/shop/api/query-keys.ts` (modify) — tambah `detail(slug)`. Tujuan: cache terisolasi.
- `apps/web/src/features/shop/hooks/use-shop-queries.ts` (modify) — tambah `useProductDetail(slug)` + `productDetailQuery(slug)` (queryOptions shared loader). Tujuan: hook konsumsi.
- `apps/web/src/features/shop/lib/product-detail.ts` — `resolveVariantPrice`, `clampQty`, `formatVariantLabel`. Tujuan: logika murni teruji manual.
- `apps/web/src/features/shop/hooks/use-mini-cart.ts` + `lib/mini-cart-storage.ts` — state cart + localStorage adapter. Tujuan: mini-cart lokal.
- `apps/web/src/features/shop/components/product/{product-gallery.tsx,product-info.tsx,variant-selector.tsx,gift-note-field.tsx,quantity-stepper.tsx,purchase-bar.tsx,product-tabs.tsx,review-summary.tsx,review-list.tsx,related-rail.tsx,mini-cart-drawer.tsx}` — satu tanggung jawab per file. Tujuan: modul dalam.
- `apps/web/src/components/ui/{drawer.tsx,tabs.tsx}` — wrapper Base UI. Tujuan: design system.
- `apps/web/src/features/shop/components/card-product.tsx` (modify) — alert→`Link`. Tujuan: unblock navigasi.

## 7. Task berurutan

> Catatan toolchain: tiap task verifikasi `pnpm --filter client-web-delysa-florist exec tsc --noEmit` + `pnpm --filter client-web-delysa-florist exec prettier --check "<file>"`. Expected exit 0. `build` penuh hanya di Task akhir (`vite build && tsc --noEmit`). Tanpa unit runner → "gagal yang diharapkan" = `tsc` gagal / render manual gagal sebelum implementasi, dicatat jujur per task.

### Task 1: Seam data detail — tipe + fixture + endpoint + queryKey + hook

**Files:**
- Modify: `apps/web/src/features/shop/types.ts`
- Create: `apps/web/src/mock/products/product-detail.json`
- Modify: `apps/web/src/features/shop/api/mock.ts`
- Modify: `apps/web/src/features/shop/api/endpoints.ts`
- Modify: `apps/web/src/features/shop/api/query-keys.ts`
- Modify: `apps/web/src/features/shop/hooks/use-shop-queries.ts`
- Create: `apps/web/src/features/shop/lib/product-detail.ts`

**Interfaces:**
- Consumes: `UnifiedProduct`, `CatalogItem` (`types.ts:56-74`), `mockGet`, `ApiError` (`api/mock.ts:124-132`, `api/http.ts:11-19`), `productQueries` (`api/query-keys.ts:7-18`).
- Produces:
```ts
export type ProductSizeOption = { id: string; label: string; stems?: string; priceDelta: number };
export type ProductWrapOption = { id: string; label: string; sub?: string; priceDelta?: number };
export type ProductDetail = UnifiedProduct & { stock: number; reviewCount: number; badge?: string; gallery: string[]; description: string; care: string[]; specs: { label: string; value: string }[]; shipping: string[]; sizes: ProductSizeOption[]; wraps: ProductWrapOption[]; ratingBreakdown: { stars: number; pct: number }[]; reviews: { id: string; name: string; initials: string; rating: number; date: string; variant: string; text: string; verified: boolean; helpful: number }[] };
export function getProductBySlug(slug: string, signal?: AbortSignal): Promise<ProductDetail>;
export const productDetailQuery = (slug: string) => queryOptions({ queryKey: productQueries.detail(slug), queryFn: ({ signal }) => getProductBySlug(slug, signal), staleTime: 5*60_000, retry: 1 });
export function useProductDetail(slug: string): ReturnType<typeof useQuery<ProductDetail>>;
export function resolveVariantPrice(base: number, size?: ProductSizeOption, wrap?: ProductWrapOption): number;
export function clampQty(qty: number, max: number): number;
```

- [ ] **Step 1: Tambah tipe PDP di `types.ts`** (di bawah `UnifiedProduct`, tanpa ubah tipe existing). Expected: `tsc` masih hijau sebelum fixture.
- [ ] **Step 2: Tulis `product-detail.json`** — minimal 4 entri slug yang sudah ada di `catalog.json` (`single-sunflower-mentari-wisuda`, `buket-wisuda-elegant-golden-champagne`, `buket-mawar-velvet-passion-15-tangkai`, satu slug hero "the-grand-monolith-peach-ivory" untuk Image 1 dengan harga 650000 + coret 750000 + gallery 5 Unsplash `w=800&q=80` + sizes [Standard 450000, Grand Luxury 650000, Imperial 920000] + wraps [Onyx & Gold, Cream Ivory, Blush Pink] + description/care/specs/shipping + ratingBreakdown [92,6,2,0,0] + 2 reviews verified). Expected: `grep -c slug` = 4.
- [ ] **Step 3: Registrasi mock + `getProductBySlug` + `detail()` key + `useProductDetail` + `product-detail.ts` murni.** `getProductBySlug`: `mockGet<ProductDetail[]>("/products/detail")` lalu `find(slug)`; tak ketemu → `throw new ApiError(404, ...)`. Abort signal diteruskan. Expected sebelum implementasi: import gagal (`tsc` error "has no exported member").
- [ ] **Step 4: Verifikasi tipe + format.** Run: `pnpm --filter client-web-delysa-florist exec tsc --noEmit` lalu `prettier --check` 6 file. Expected: exit 0.
- [ ] **Step 5: Uji logika manual** (devtools / node): `resolveVariantPrice(450000, {priceDelta:200000})` = 650000; `clampQty(99,4)` = 4; `clampQty(0,4)` = 1. Expected: cocok.
- [ ] **Step 6: Commit.** `git add` 7 file + `git commit -m "feat(pdp): add product detail data seam by slug"`.

### Task 2: Route tipis + refactor CardProduct Link (unblock navigasi)

**Files:**
- Create: `apps/web/src/routes/_shop/products.$slug.tsx`
- Modify: `apps/web/src/features/shop/components/card-product.tsx`
- Create sementara: `apps/web/src/features/shop/view/product-detail-page.tsx` (placeholder sukses + NotFound, diganti penuh Task 3-7)

**Interfaces:**
- Consumes: `productDetailQuery` (Task 1), `NotFound` (`components/NotFound.tsx`), `seo` (`utils/seo.ts`), `Link`, `createFileRoute`, `notFound` (`@tanstack/react-router`).
- Produces: `Route = createFileRoute('/_shop/products/$slug')({ loader, head, notFoundComponent, component })`; `CardProduct` props sama, tanpa `window.alert`, render `Link to="/products/$slug" params={{ slug: item.slug }}`.

- [ ] **Step 1: Tulis failing check** — klik kartu di `/katalog` masih `alert` (bukti manual). Expected: alert muncul = gagal yang diharapkan.
- [ ] **Step 2: Refactor `CardProduct`:** ganti `article role="link"` + `onClick alert` menjadi `Link` (pertahankan class + focus-visible + `aria-label="Lihat detail {name}"`); soldOut tetap tampil "Stok Habis" tapi link tetap aktif (detail stok-0 boleh dibuka). Update 3 pemanggil tidak perlu (props sama). Expected: tidak ada `window.alert` tersisa (`grep -r "window.alert" src/features/shop/components/card-product.tsx` kosong).
- [ ] **Step 3: Tulis route tipis:** `params` string slug (tanpa coerce); `loader: ({ params, context }) => context.queryClient.ensureQueryData(productDetailQuery(params.slug)).catch((e) => { if (e instanceof ApiError && e.status === 404) throw notFound(); throw e; })`; `head: ({ loaderData }) => ({ meta: seo({ title: loaderData?.name ?? 'Detail Produk', description: ..., image: loaderData?.gallery?.[0] }) })`; `notFoundComponent: () => <NotFound><p>Produk tidak ditemukan.</p></NotFound>`; `component: ProductDetailRouteComponent` (baca `Route.useParams()` → `<ProductDetailPage slug={slug} />`). Placeholder view: bila `useProductDetail` pending → skeleton; error → retry; sukses → nama + harga saja.
- [ ] **Step 4: Verifikasi.** `tsc --noEmit` + `prettier --check` 3 file. Expected: exit 0. Manual: buka `/products/buket-wisuda-elegant-golden-champagne` sukses placeholder; `/products/tak-ada-xyz` → NotFound; klik kartu dari `/katalog` → PDP (tanpa alert).
- [ ] **Step 5: Commit.** `git commit -m "feat(pdp): add products slug route and card link"`.

### Task 3: Galeri + info + varian + kartu ucapan (atas PDP)

**Files:**
- Create: `apps/web/src/features/shop/components/product/product-gallery.tsx`
- Create: `apps/web/src/features/shop/components/product/product-info.tsx`
- Create: `apps/web/src/features/shop/components/product/variant-selector.tsx`
- Create: `apps/web/src/features/shop/components/product/gift-note-field.tsx`
- Modify: `apps/web/src/features/shop/view/product-detail-page.tsx` (komposisi atas: breadcrumb + grid 2 kolom)

**Interfaces:**
- Consumes: `ProductDetail`, `resolveVariantPrice`, `formatIDR` (`lib/format.ts`), `Breadcrumb*` (`ui/breadcrumb.tsx`), `Badge`, `Carousel*` (`ui/carousel.tsx`).
- Produces:
```tsx
ProductGallery({ images, name, badges }: { images: string[]; name: string; badges: React.ReactNode }) // hero eager + thumbs button aria-pressed + aria-label "Gambar i dari N"
ProductInfo({ detail, size, wrap }: { detail: ProductDetail; size: ProductSizeOption; wrap: ProductWrapOption }) // eyebrow, rating link, nama h1, harga + coret + Hemat%, stok live
VariantSelector({ title, options, value, onChange, hint }: { title: string; options: { id; label; sub?; price? }[]; value: string; onChange: (id: string) => void; hint?: string }) // button-card, aria-pressed, harga per opsi
GiftNoteField({ value, onChange }: { value: string; onChange: (v: string) => void }) // Textarea maxLength 200 + counter aria-live + pesan error bila >200 (dicegah)
```

- [ ] **Step 1: Tulis 4 komponen** mengikuti token Image 1 (`#1A1A1A`, `#6B7280`, `rounded-xs`, `border-[#E5E7EB]`) + `min-h` anti-CLS. `ProductGallery`: hero `loading="eager"` pertama, sisanya `lazy`; thumbs `grid-cols-5`. `ProductInfo`: rating `Star fill-amber-400` + `<a href="#ulasan">348 Ulasan</a>`; stok: hijau bila >0 ("Stok Tersedia: Sisa 4 Buket Hari Ini • TASIKMALAYA STUDIO"), abu bila 0.
- [ ] **Step 2: Komposisi atas di `product-detail-page.tsx`:** `Breadcrumb (Home/Shop/nama)` + `main grid lg:grid-cols-2` (kiri galeri, kanan info+varian+note). State lokal: `sizeId` default Grand Luxury (atau pertama in-stock), `wrapId` default pertama, `note` "".
- [ ] **Step 3: Verifikasi.** `tsc` + `prettier`. Expected: exit 0. Manual desktop 1280 + mobile 360: galeri tidak overflow, varian 1-klik update harga, counter 0/200 → 200/200.
- [ ] **Step 4: Commit.** `git commit -m "feat(pdp): add gallery info variants gift-note"`.

### Task 4: Qty stepper + purchase bar + mini-cart storage + drawer

**Files:**
- Create: `apps/web/src/features/shop/lib/mini-cart-storage.ts`
- Create: `apps/web/src/features/shop/hooks/use-mini-cart.ts`
- Create: `apps/web/src/components/ui/drawer.tsx`
- Create: `apps/web/src/features/shop/components/product/quantity-stepper.tsx`
- Create: `apps/web/src/features/shop/components/product/purchase-bar.tsx`
- Create: `apps/web/src/features/shop/components/product/mini-cart-drawer.tsx`
- Modify: `apps/web/src/features/shop/view/product-detail-page.tsx` (wiring drawer + trust badges)

**Interfaces:**
- Consumes: `ProductDetail`, `clampQty`, `formatIDR`, `Button`, `Drawer*` (baru), `Textarea` tidak (sudah Task 3).
- Produces:
```ts
// mini-cart-storage.ts
export type MiniCartLine = { slug: string; name: string; image: string; sizeId: string; sizeLabel: string; wrapId: string; price: number; qty: number; note?: string };
export function loadMiniCart(): MiniCartLine[]; export function saveMiniCart(lines: MiniCartLine[]): void; export function upsertLine(lines: MiniCartLine[], line: MiniCartLine): MiniCartLine[];
// use-mini-cart.ts
export function useMiniCart(): { lines: MiniCartLine[]; isOpen: boolean; setOpen: (v: boolean) => void; add: (line: MiniCartLine) => void; subtotal: number };
// quantity-stepper.tsx
QuantityStepper({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) // minus/plus 44px, input readonly? editable clamp, aria-label "Jumlah"
// purchase-bar.tsx
PurchaseBar({ qty, max, onQty, onAdd, onBuyNow, disabled }: {...}) // TAMBAH KE KERANJANG hitam + hati wishlist + Beli Langsung outline
// mini-cart-drawer.tsx
MiniCartDrawer({ open, onOpenChange, lines, subtotal }: {...}) // kanan, "Berhasil Ditambahkan", subtotal, ongkir GRATIS, total, Lanjut Belanja + Lihat Keranjang & Checkout
```

- [ ] **Step 1: Tulis storage + hook** (key `delysa:mini-cart:v1`, try/catch JSON, tanpa PII). Expected gagal dulu: `tsc` error "cannot find module" sebelum file dibuat.
- [ ] **Step 2: Tulis `ui/drawer.tsx`** meniru `ui/dialog.tsx` (Root/Trigger/Portal/Viewport/Popup/Content/Title/Close, `swipeDirection="right"`, fokus trap default modal). Expected: import `@base-ui/react/drawer` lolos `tsc`.
- [ ] **Step 3: Tulis stepper + purchase + drawer + trust 2x2** (icons Truck/ShieldCheck/CreditCard/Headset, teks Image 1). Wiring di view: `onAdd` → `add({ slug, sizeId, wrapId, qty, price: resolveVariantPrice })` + `setOpen(true)`; `onBuyNow` → sama (tahap ini buka drawer, bukan `/checkout`); stok-0 → semua disabled.
- [ ] **Step 4: Verifikasi.** `tsc` + `prettier`. Expected: exit 0. Manual: tambah 2 qty Grand Luxury → drawer subtotal Rp1.300.000, reload → persist, Esc/backdrop menutup, fokus kembali ke ATC.
- [ ] **Step 5: Commit.** `git commit -m "feat(pdp): add qty purchase mini-cart drawer"`.

### Task 5: Tabs/accordion + review + terkait + 5-state + SEO polish

**Files:**
- Create: `apps/web/src/components/ui/tabs.tsx`
- Create: `apps/web/src/features/shop/components/product/product-tabs.tsx`
- Create: `apps/web/src/features/shop/components/product/review-summary.tsx`
- Create: `apps/web/src/features/shop/components/product/review-list.tsx`
- Create: `apps/web/src/features/shop/components/product/related-rail.tsx`
- Modify: `apps/web/src/features/shop/view/product-detail-page.tsx` (bawah PDP + 5-state + sticky ATC mobile)

**Interfaces:**
- Consumes: `ProductDetail`, `Accordion*`, `Tabs*` (baru), `CardProduct`, `Button`, `useCategoryProducts`/`useProducts` (existing untuk terkait).
- Produces:
```tsx
ProductTabs({ description, care, specs, shipping }: {...}) // Tabs desktop (3 trigger) + Accordion mobile, satu konten
ReviewSummary({ rating, count, breakdown }: {...}) // 4.9 besar + stars + bar 5→1 + RINGKASAN SENTIMEN box
ReviewList({ reviews }: {...}) // filter chips (Semua/Dengan Foto/Wisuda/Anniversary) + sort select + kartu verified + Membantu/Laporkan + Tulis Ulasan button (disabled + tooltip auth)
RelatedRail({ category, currentSlug }: {...}) // "Lengkapi Momen Spesial Anda" + 4 CardProduct variant=default + "Lihat Semua Koleksi Wisuda →" Link to /katalog
```

- [ ] **Step 1: Tulis `ui/tabs.tsx`** (Root/List/Trigger/Panel meniru `accordion.tsx` + `aria-selected`). Expected: `tsc` hijau.
- [ ] **Step 2: Tulis tabs + review + related** mengikuti Image 1 (tab underline aktif, distribusi bar `bg-[#111]` proporsional, chips `rounded-full border`, ulasan avatar inisial + `Pembelian Terverifikasi Tasikmalaya`). Terkait: `useCategoryProducts(detail.category)` filter `slug !== current`, fallback `useProducts({page:1})`; skeleton reuse `ProductCardSkeleton`.
- [ ] **Step 3: Finalisasi view:** susunan `breadcrumb → atas grid → trust → tabs → ulasan (#ulasan) → terkait → terakhir-dilihat strip → footer atelier (statis teks Image 1)`; 5-state: `isPending` → skeleton galeri+info; `isError` → error card + retry (`queryClient.invalidateQueries(detail key)`); `demo=loading|empty|error` harness (ikuti `index.tsx:8-22`) untuk QA; sticky ATC mobile (`fixed bottom-0 lg:hidden`, muncul bila ATC utama out-of-view via IntersectionObserver sederhana, berisi varian label + harga + tombol Tambah).
- [ ] **Step 4: Verifikasi penuh.** Run berurutan: `pnpm --filter client-web-delysa-florist exec prettier --check "src/**/*.{ts,tsx}"`, `pnpm --filter client-web-delysa-florist exec tsc --noEmit`, `pnpm --filter client-web-delysa-florist build`. Expected: exit 0 semua. Manual 7 skenario AC §2 + Review Focus di desktop + 360px + keyboard-only (Tab/Enter/Esc) + Lighthouse LCP cek hero <2.5s (catat angka).
- [ ] **Step 5: Commit.** `git commit -m "feat(pdp): compose tabs reviews related five-states"`.

## 8. Rencana verifikasi per acceptance criteria

| AC (§2) | Verifikasi | Perintah / cara |
|---|---|---|
| Klik kartu → PDP, tanpa alert | Manual klik + keyboard di `/`, `/katalog`, flash-sale | dev server + `grep -r window.alert card-product` kosong |
| Render penuh Image 1 | Manual `/products/the-grand-monolith-peach-ivory` desktop + 360px | dev server, bandingkan section per section |
| Varian 1-klik update harga | Klik Standard/Imperial + 3 wrapping | dev server, harga + label berubah, `aria-pressed` benar |
| Qty clamp + stok-0 disabled | Ketik 99 / buka slug stok-0 | dev server, clamp + disabled + label |
| Kartu ucapan 200 char | Tempel 250 char | dev server, counter + pesan |
| Drawer + persist | Tambah → drawer → reload → Esc | dev server + Application→Local Storage key cek |
| Slug tak ada → NotFound; error → retry | Buka slug ngawur + `?demo=error` | dev server, NotFound + retry invalidate |
| Toolchain hijau | format → typecheck → build | `format:check`, `tsc --noEmit`, `build` exit 0 |
| SEO meta | View-source / React DevTools head | `seo()` title + og:image gallery[0] terisi |
| A11y + LCP | Keyboard-only + Lighthouse | Tab order, fokus drawer, LCP <2.5s catat |

## 9. Risiko & mitigasi

- **Fixture PDP vs pool katalog drift** (slug/nama/harga beda): mitigasi — 3 slug PDP reuse persis `catalog.json`, hero slug ke-4 ditambah ke kedua pool bila perlu; `getProductBySlug` cari di `product-detail.json` dulu, fallback pool katalog sebagai `ProductDetail` minimal (galeri `[image]`, sizes default).
- **Refactor CardProduct menyentuh 3 pemanggil:** mitigasi — props tidak berubah, hanya dalam (`Link` vs `article`); verifikasi klik di `/`, `/katalog`, flash-sale per Task 2; jaga `aria-label` + fokus.
- **Drawer/tabs wrapper Base UI API beda 1.8.0:** mitigasi — tiru `dialog.tsx`/`accordion.tsx` persis; bila `Drawer.Viewport` wajib, ikuti contoh docs resmi (riset §2c); uji Esc/backdrop/fokus di Task 4.
- **Race ganti slug:** mitigasi — `queryKey detail(slug)` terisolasi + `keepPreviousData` + `signal` abort (ikuti `use-shop-queries.ts`); terkait tidak prefetch slug baru sebelum klik (intent preload default sudah cukup).
- **Tanpa test otomatis:** mitigasi — harness `?demo=` + checklist §8 + `tsc` per task; e2e Playwright ditambah bila DoD menagih (di luar plan).
- **LCP/image:** mitigasi — hero `eager` + `w=800`, thumbs `lazy`, tanpa video 360° tahap ini (YAGNI); ukur Lighthouse di Task 5, catat jujur bila >2.5s.
- **Scope penuh Image 1 membesar:** mitigasi — task kecil 2-5 mnt, commit per task; bila review meminta pangkas, pangkas vertikal (review filter dulu, bukan galeri/ATC).

## 10. Referensi

- context7 `/tanstack/router` (terpasang 1.170.41): `$slug` dynamic, `loader` + `throw notFound()` + `notFoundComponent`, `params.parse` zod, `useParams({ from })`.
- context7 `/tanstack/query` (terpasang 5.102.0): `queryOptions` + `ensureQueryData` + `useSuspenseQuery`, `keepPreviousData`, `retry:1`, `staleTime 5mnt`.
- context7 `/mui/base-ui` (terpasang 1.8.0, drawer/tabs ada di `apps/web/node_modules/@base-ui/react`): Drawer Root/Trigger/Portal/Viewport/Popup/Content/Title/Close + `swipeDirection="right"` + `modal`.
- Riset: `docs/research/pdp-products-slug.md` (sumber primer §5 di dalamnya: Baymard, NNGroup, Shopify, Pixeltree, TanStack examples).
- Repo: `apps/web/src/routes/_shop/{route.tsx,katalog.tsx:1-15,index.tsx:8-22}`, `apps/web/src/router.tsx:8-24`, `apps/web/src/features/shop/{types.ts,api/{endpoints.ts,mock.ts:22-132,http.ts,query-keys.ts},hooks/use-shop-queries.ts:18-71,components/{card-product.tsx:25-41,catalog/catalog-grid.tsx:64-70,storefront/{product-rail.tsx:85-89,flash-sale-section.tsx:137-145}},view/{catalog-page.tsx:56-238,storefront-page.tsx},data/{catalog.ts,storefront.ts},lib/format.ts}`, `apps/web/src/components/{ui/{button.tsx,badge.tsx,dialog.tsx:1-157,carousel.tsx:1-240,accordion.tsx:1-77,textarea.tsx},NotFound.tsx:1-54}`, `apps/web/src/utils/seo.ts:1-33`, `apps/web/src/mock/products/catalog.json`, `docs/research/fe/{shop.md:25-31,route-map.md:18-45}`, `docs/prd/PRD-Frontend-Delysa-Florist.md:95-118`, `docs/superpowers/plans/2026-10-13-katalog-cp37.md`, Linear CP-35 (In Progress) / CP-13, `packages/shared/openapi.yaml:28-47` (list saja — detail "tidak terverifikasi").

# [M4][FE] S-04 Keranjang Belanja /keranjang — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Halaman keranjang fungsional penuh (lokal, mock-only) di `/keranjang` yang mereplikasi mockup Image 1 — daftar item dengan qty/hapus/pilih/simpan, ringkasan belanja (diskon, ongkir flat, kupon, total), progress gratis ongkir, instruksi antar, add-ons atelier, dan integrasi badge header + drawer + PDP — tanpa backend baru.

**Architecture:** State keranjang dipindah dari hook-local `useState` ke external store modul (`lib/mini-cart-store.ts`, subscribe/getSnapshot + actions) yang dikonsumsi via `useSyncExternalStore` dengan `getServerSnapshot` kosong (SSR-safe), dipersist ke `localStorage` key `delysa:cart:v2` (migrasi sekali dari `delysa:mini-cart:v1`). Perhitungan uang dipisah ke fungsi murni (`lib/cart-totals.ts`) dengan konstanta bersama (`lib/cart-rules.ts`) yang diselaraskan ke drawer & halaman. UI mengikuti pola repo: route tipis + view `features/shop/view/cart-page.tsx` + komponen `features/shop/components/cart/*`.

**Tech Stack:** React 19, TanStack Router/Query, Base UI 1.8.0 (`@base-ui/react/checkbox`), Tailwind v4, `cn` (pkg `"cn"`), lucide-react, zod, Vitest/Playwright tidak tersedia untuk unit → verifikasi via `?demo=` + checklist manual (deviasi TDD dicatat).

**Spec:** Linear CP-39 (parent CP-17), `docs/research/fe/shop.md:33-39` (§S-04), PRD-FE FE-3 + FR-03-01/02, riset `docs/research/keranjang-belanja.md`, Image 1 chat (sumber visual + copywriting).

**Status CP-39:** In Progress — milestone M4, label `FE`, branch `feature/cp-39`. Implementasi menambah deviasi tercatat terhadap CP-39 (lihat §3).

## Global Constraints

- Tipe request/response API dari `@delysa/shared` bila ada; keranjang tahap ini FE-lokal (kontrak BE `/cart` dan `guest_token` belum ada → tandai "tidak terverifikasi"), tipe lokal di `apps/web/src/features/shop/types.ts`.
- Validasi input memakai zod: `couponCodeSchema` (trim 3..32 → uppercase); instruksi antar dibatasi `maxLength` 300.
- File route tidak boleh meng-export komponen (PRD-FE §4 #3; pola `routes/_shop/katalog.tsx:1-15`).
- Tanpa dependency baru (Checkbox Base UI sudah terpasang; `cn` dari paket `"cn"`).
- Jangan sentuh `apps/api/`, `packages/shared/openapi.yaml`, `apps/web/src/routeTree.gen.ts`.

## Review Focus

1. Hidrasi SSR `/keranjang`: tidak ada akses `localStorage` saat render server; badge header mulai 0 lalu terisi setelah mount tanpa hydration mismatch/warning.
2. Qty cepat berturut di batas cap (`maxQty`, min 1): subtotal/total selalu konsisten; tidak ada baris salah merge/hilang.
3. Kupon: kosong/kode salah (error jelas, total tak berubah)/huruf kecil (case-insensitive)/valid; chip terpasang dan dilepas mengembalikan Grand Total; `DELYSAFIRST` terpasang otomatis.
4. Hapus 1 item + "Hapus Pilihan" + undo: key `kind:slug:size:wrap` tidak salah hapus baris lain; undo mengembalikan qty & posisi benar.
5. Desktop sticky ringkasan + mobile 360px: tidak overlap header/footer, tanpa scroll horizontal, urutan fokus keyboard logis dan terlihat.

## 1. Ringkasan & scope

Halaman `/keranjang` penuh sesuai Image 1: breadcrumb + judul + subtitle; badge slot pengiriman; banner tamu; "Pilih Semua Item (N)" + "Hapus Pilihan"; baris item (thumbnail, nama, varian, harga coret/diskon, steker qty, Simpan, ×, chips bonus); progress gratis ongkir; textarea instruksi antar; kolom ringkasan (Total Harga, Diskon Promo Produk, Estimasi Ongkir + coret Rp25.000, Kemasan GRATIS, kupon + chip terpasang, Total Akhir + catatan PPn, CTA Checkout, tombol kembali, 3 trust badges); seksi add-ons; footer layout existing.

Fungsional hanya lokal (mock-only): checkout → toast placeholder; "Masuk / Buat Akun" → dead link; semua state persisten di localStorage.

## 2. Acceptance Criteria

- AC-1 route `/keranjang` ada, publik, SSR aman; `?demo=loading|empty|error` berfungsi.
- AC-2 tambah/kurang qty dan hapus item langsung memperbarui subtotal, total item, dan ringkasan (tanpa tombol update) — CP-39.
- AC-3 "Pilih Semua Item (N)" benar (checked penuh / indeterminate sebagian), "Hapus Pilihan" menghapus item terpilih + toast undo.
- AC-4 kupon: `DELYSAFIRST` terpasang default bernilai Rp0 (total tetap 740k sesuai mockup); `DELYSAWISUDA` demo Rp25.000 mengubah Total Akhir; kode invalid → pesan error; chip bisa dilepas (persisten).
- AC-5 ringkasan menampilkan Total Harga 740k (skenario mockup 650k + 2×45k), Diskon −130k (informatif), Ongkir GRATIS (coret Rp25.000), Kemasan GRATIS, Total Akhir 740k.
- AC-6 empty state + CTA "Jelajahi Katalog" → `/katalog`; CTA checkout disabled saat kosong.
- AC-7 persist lintas reload (key v2 + migrasi v1); badge header = jumlah qty live; drawer "Lihat Keranjang (N)" → `/keranjang` + ongkir 25.000 konsisten.
- AC-8 add-ons 4 kartu: "+ Tambah" memasukkan ke keranjang, kartu menampilkan "Ditambahkan ✓"; qty add-on via steker di baris.
- AC-9 chips bonus tampil bila `ProductDetail.bonuses` ada (fixture hero: "Kartu Ucapan Kustom", "Bonus Pita Wisuda UNSIL Kuning-Emas").
- AC-10 "Simpan" menampilkan seksi "Disimpan untuk Nanti (N)" persisten; bisa dipindah kembali / dihapus.
- AC-11 responsif 360–1440px tanpa scroll horizontal; hanya satu primary action terlihat per viewport.
- AC-12 `format:check`, `tsc --noEmit`, `build` 0 error (DoD CP-39).

## 3. Asumsi & di luar scope

Asumsi (dikonfirmasi user di gate):
- Sumber data = localStorage existing yang diperluas (tanpa endpoint mock baru).
- Route `/keranjang`, bukan `/cart` (deviasi dari CP-39/shop.md — disetujui).
- Implementasi diletakkan di `features/shop/*` mengikuti preseden PDP plan (deviasi dari `src/features/cart/*` CP-39 — disetujui).
- Biaya final: `DELYSAFIRST` Rp0 default (keputusan user "Ikuti mockup"), grand total skenario mockup = Rp740.000.

Di luar scope (deferred, catat "tidak terverifikasi"):
- Kontrak BE `/cart`, TTL persist 30 hari (auth) / 7 hari (guest) + `guest_token` — ranah API, tidak ada di repo.
- Error `STOCK_INSUFFICIENT` runtime (ditampilkan saat BE ada); cap `maxQty` lokal sudah menyiapkan jalur render "sisa stok".
- Halaman checkout, auth nyata ("Masuk / Buat Akun" dead link), pengiriman slot real, e2e baru (harness `?demo=` dipakai untuk 5-state).

## 4. Temuan repo (bukti)

- `apps/web/src/features/shop/hooks/use-mini-cart.ts:13-37` — state lokal (lines/isOpen/wishlist/add/subtotal), komentar "evolusi ke S-04 tinggal ganti adapter".
- `apps/web/src/features/shop/lib/mini-cart-storage.ts:3,33-51` — key `delysa:mini-cart:v1`; `upsertLine` merge slug+sizeId+wrapId (dipakai ulang).
- `apps/web/src/features/shop/components/product/mini-cart-drawer.tsx:13,32,110-117` — `FREE_SHIPPING_MIN=200000` duplikat, ongkir 15000, CTA `/katalog`.
- `apps/web/src/features/shop/components/storefront/shop-header.tsx:144-157` — tombol cart `window.alert` + badge statis 0.
- `apps/web/src/features/shop/types.ts` — `MiniCartLine` (tanpa kind/originalPrice/bonuses/maxQty/wrapLabel), `ProductDetail` (tanpa bonuses).
- `apps/web/src/routes/_shop/route.tsx:6-21` — ShopLayout; `<Toaster>` belum di-mount di mana pun (`components/ui/toast.tsx:15,193-227`).
- `apps/web/src/routes/_shop/katalog.tsx:1-15`, `index.tsx:8-22`, `products.$slug.tsx:16-58` — pola route tipis + `?demo=` + head seo.
- `apps/web/src/components/ui/radio-group.tsx:1-35` — pola wrapper Base UI + `cn` dari paket `"cn"` (checkbox belum ada).
- `apps/web/src/features/shop/data/storefront.ts:3-4` — helper `img(id, w)` Unsplash untuk data statis.
- `apps/web/src/features/shop/view/catalog-page.tsx` — pola empty/error + breadcrumb.

## 5. Keputusan desain & alternatif ditolak

1. **External store `mini-cart-store.ts` + `useSyncExternalStore`** (dipilih) vs React Context: repo belum punya Context; store menjamin satu sumber kebenaran untuk header/drawer/PDP/halaman, update granular tanpa re-render blast, `getServerSnapshot` = state kosong aman SSR. Context ditolak.
2. **Checkbox induk manual** (`checked` semua + `indeterminate` sebagian) vs `CheckboxGroup`+`allValues`: manual lebih kecil interface & tidak mengikat state pilihan halaman ke primitif; Group ditolak (dicatat bisa revisi saat review).
3. **Kupon default `DELYSAFIRST` Rp0** (auto-apply, chip terpasang) vs nilai demo Rp25.000 default: fidelity mockup (Total Akhir 740k) menang; `DELYSAWISUDA` Rp25.000 disediakan sebagai demo perubahan angka.
4. **Storage v2 objek `{lines, saved, coupon, instructions}` + migrasi sekali** vs multi-key terpisah: satu write atomik, satu read; key lama dibaca sekali lalu ditulis v2.
5. **Simpan-untuk-nanti dipertahankan** (mockup ada tombol "Simpan") — kandidat trim pertama bila scope menekan, bersama progress bar; core tidak terpengaruh.
6. **Undo via toast** (Base UI `toast.add` + `actionProps`) vs dialog konfirmasi hapus: literatur Baymard (#3b) mendukung hapus cepat + undo, bukan friksi konfirmasi.
7. **`SHIPPING_FLAT=25000`** diselaraskan drawer 15000→25000 (mockup menampilkan Rp25.000 coret).
8. **Route `/keranjang`** (user) vs `/cart` (CP-39): deviasi tercatat; file mengikuti pola route-map.

## 6. Reuse Decision Table & File Placement Map

Reuse Decision Table — "butuh X → pakai Y":

| Kebutuhan | Pakai | Lokasi |
|---|---|---|
| Tampilan harga | `formatIDR` | `features/shop/lib/format.ts` |
| Steker qty | `QuantityStepper` (prop `max` sudah ada) | `features/shop/components/product/quantity-stepper.tsx` |
| Textarea instruksi | `Textarea` ui | `features/shop/components/product/gift-note-field.tsx` pola + `ui/textarea` |
| Checkbox | BARU `ui/checkbox.tsx` (pola radio-group) | `components/ui/checkbox.tsx` |
| Toast + undo | singleton `toast` + `Toaster` | `components/ui/toast.tsx` |
| Data statis (add-ons) | pola `data/storefront.ts` + `img()` | `features/shop/data/cart-addons.ts` |
| Ikon | lucide-react | — |
| Pola route tipis/harness | `katalog.tsx` / `index.tsx` | `routes/_shop/*` |

File Placement Map:
- CREATE: `features/shop/lib/cart-rules.ts`, `lib/cart-totals.ts`, `lib/cart-coupons.ts`, `lib/mini-cart-store.ts`; `data/cart-addons.ts`; `components/cart/` → `cart-line-item.tsx`, `cart-select-bar.tsx`, `order-summary.tsx`, `coupon-field.tsx`, `free-shipping-progress.tsx`, `cart-instructions-field.tsx`, `atelier-addons.tsx`, `saved-for-later.tsx`, `guest-banner.tsx`, `delivery-slot-note.tsx`; `view/cart-page.tsx`; `routes/_shop/keranjang.tsx`; `components/ui/checkbox.tsx`.
- MODIFY: `features/shop/types.ts`, `lib/mini-cart-storage.ts`, `hooks/use-mini-cart.ts`, `components/product/mini-cart-drawer.tsx`, `components/storefront/shop-header.tsx`, `view/product-detail-page.tsx`, `routes/_shop/route.tsx`, `mock/products/product-detail.json`.

## 7. Tasks

### Task 1 — Seam state (types, lib murni, storage v2, store, hook)

**Files:** `types.ts`, `lib/cart-rules.ts` (C), `lib/cart-totals.ts` (C), `lib/cart-coupons.ts` (C), `lib/mini-cart-storage.ts`, `lib/mini-cart-store.ts` (C), `hooks/use-mini-cart.ts`

Interface kunci:
```ts
export type CartLineKind = "product" | "addon";
export interface MiniCartLine {           // extend existing
  slug: string; name: string; image: string;
  sizeId: string; sizeLabel: string; wrapId: string; wrapLabel?: string;
  price: number; qty: number; note?: string;
  kind?: CartLineKind;                    // default "product"
  originalPrice?: number;                 // harga coret per unit
  bonuses?: string[];                     // chips bonus
  maxQty?: number;                        // cap steker (default 10)
}
export interface CartCoupon { code: string; label: string; amount: number }
export interface CartSnapshot { lines: MiniCartLine[]; saved: MiniCartLine[]; coupon: CartCoupon | null; instructions: string }
```
```ts
// lib/cart-rules.ts
export const FREE_SHIPPING_MIN = 200000;
export const SHIPPING_FLAT = 25000;
export const CART_LINE_MAX_DEFAULT = 10;
export function lineKey(l: Pick<MiniCartLine, "kind" | "slug" | "sizeId" | "wrapId">): string; // `${kind ?? "product"}:${slug}:${sizeId}:${wrapId}`
// lib/cart-totals.ts — pure, integer rupiah
export interface CartTotals { itemCount: number; subtotalNormal: number; productDiscount: number; subtotal: number; shipping: number; packaging: number; couponDiscount: number; grandTotal: number; freeShipping: boolean; remainingForFree: number }
export function computeCartTotals(lines: MiniCartLine[], coupon: CartCoupon | null): CartTotals;
// lib/cart-coupons.ts
export const DEFAULT_COUPON: CartCoupon;                       // { code: "DELYSAFIRST", label: "Potongan Pengguna Baru", amount: 0 }
export function resolveCoupon(code: string): CartCoupon | null; // DELYSAFIRST(0) | DELYSAWISUDA(25000)
export const couponCodeSchema = z.string().trim().min(3).max(32).transform(v => v.toUpperCase());
```
```ts
// lib/mini-cart-storage.ts (rewrite, keep upsertLine)
export interface StoredCartState { lines: MiniCartLine[]; saved: MiniCartLine[]; coupon?: CartCoupon | null; instructions?: string }
export function loadCartState(): StoredCartState | null;  // v2 dari "delysa:cart:v2"; fallback migrasi baca "delysa:mini-cart:v1" → { lines, saved: [] }
export function saveCartState(s: StoredCartState): void;   // try/catch quota
// lib/mini-cart-store.ts — satu sumber kebenaran
export const EMPTY_CART_SNAPSHOT: CartSnapshot;            // beku, dipakai getServerSnapshot
export function getCartSnapshot(): CartSnapshot;           // aman pra-hidrasi
export function getServerCartSnapshot(): CartSnapshot;
export function subscribeCart(listener: () => void): () => void; // hydrate lazy sekali + persist tiap mutasi
export function addLine(line: MiniCartLine): void;
export function updateLineQty(key: string, qty: number): void;   // clamp 1..(maxQty ?? CART_LINE_MAX_DEFAULT)
export function removeLines(keys: string[]): void;
export function saveForLater(key: string): void; export function moveToCart(key: string): void; export function removeSaved(key: string): void;
export function applyCoupon(code: string): { ok: true; coupon: CartCoupon } | { ok: false; error: string };
export function removeCoupon(): void; export function setInstructions(text: string): void;
```
Semantik kupon: `coupon` awal = `DEFAULT_COUPON` bila belum pernah disimpan (`undefined`), `null` bila user melepasnya; chip Rp0 tidak mengubah angka.

- [ ] 1.1 Tambah tipe di `types.ts` + `ProductDetail.bonuses?: string[]`; jalankan `pnpm --filter client-web-delysa-florist exec tsc --noEmit` → 0 error.
- [ ] 1.2 Tulis `cart-rules.ts`, `cart-totals.ts`, `cart-coupons.ts` (murni, tanpa React).
- [ ] 1.3 Tulis ulang `mini-cart-storage.ts` v2 + migrasi v1.
- [ ] 1.4 Tulis `mini-cart-store.ts`; rebind `use-mini-cart.ts` ke store — API lama tetap (`add`, `isOpen/setOpen`, `wishlist/setWishlist`, `lines`, `subtotal`) + API baru (`count`, `updateQty`, `remove`, `removeMany`, `saved`, `saveForLater`, `moveToCart`, `removeSaved`, `coupon`, `applyCoupon`, `removeCoupon`, `instructions`, `setInstructions`).
- [ ] 1.5 Cek angka murni: `computeCartTotals([{price:650000,originalPrice:750000,qty:1,...},{price:45000,originalPrice:60000,qty:2,...}], DEFAULT_COUPON)` → subtotal 740000, productDiscount 130000, shipping 0, grandTotal 740000; `resolveCoupon("delysawisuda")` → 25000.
- [ ] 1.6 Verifikasi: `format:check` + `tsc --noEmit` → hijau; commit.

### Task 2 — Checkbox primitif + route + inti daftar (slice vertikal pertama)

**Files:** `components/ui/checkbox.tsx` (C), `routes/_shop/keranjang.tsx` (C), `view/cart-page.tsx` (C), `components/cart/cart-line-item.tsx` (C), `components/cart/cart-select-bar.tsx` (C), `routes/_shop/route.tsx`

Interface kunci:
```tsx
// ui/checkbox.tsx — pola radio-group.tsx; import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"; import { cn } from "cn";
function Checkbox({ className, indeterminate, ...props }: CheckboxPrimitive.Root.Props); // Root + Indicator (CheckIcon / MinusIcon utk indeterminate)
// cart di view/page props
CartPage({ demo }: { demo?: "loading" | "empty" | "error" });
CartLineItem({ line, selected, onSelectedChange, onQtyChange, onRemove, onSaveLater }: {...});
CartSelectBar({ itemCount, selectedCount, allSelected, someSelected, onToggleAll, onDeleteSelected }: {...});
```
- [ ] 2.1 Tulis `ui/checkbox.tsx` (data-slot "checkbox", styling state via data-attributes).
- [ ] 2.2 Tulis route tipis `routes/_shop/keranjang.tsx` (validateSearch demo pola `index.tsx`, head seo, komponen internal — bukan export) → `pnpm --filter client-web-delysa-florist exec tsc --noEmit`.
- [ ] 2.3 Tulis `cart-line-item.tsx` (Checkbox, thumbnail, nama, `Varian: sizeLabel • wrapLabel?`, harga `formatIDR(price×qty)` + coret `originalPrice×qty` + `@unit × qty` bila >1, `QuantityStepper max={maxQty ?? 10}`, Simpan, ×) dan `cart-select-bar.tsx`.
- [ ] 2.4 Tulis `cart-page.tsx`: breadcrumb HOME / KERANJANG BELANJA, h1 + subtitle, state pilihan `Set<key>` (default semua, sinkron baris baru, prune stale), wiring store; mount `<Toaster>` membungkus layout di `routes/_shop/route.tsx`.
- [ ] 2.5 Undo toast hapus: `toast.add({ title: "Item dihapus", description, type: "info", actionProps: { children: "Urungkan", onClick } })` (verifikasi `actionProps` saat implementasi; fallback toast tanpa aksi + copy jelas).
- [ ] 2.6 Manual: tambah 2 item dari katalog/PDP → qty ±, hapus 1 (+undo), pilih semua↔sebagian (indeterminate), Hapus Pilihan; `format:check` + tsc; commit.

### Task 3 — Ringkasan, kupon, CTA, empty state

**Files:** `components/cart/order-summary.tsx` (C), `components/cart/coupon-field.tsx` (C), `view/cart-page.tsx`

Interface kunci:
```tsx
OrderSummary({ totals, coupon, onApplyCoupon, onRemoveCoupon, onCheckout }: {...}); // + 3 trust badges (ShieldCheck/Clock/Camera) di bawah CTA
CouponField({ coupon, onApply, onRemove }: { onApply: (code: string) => { ok: boolean; error?: string }; ... });
```
Baris ringkasan (label persis mockup): "Total Harga (N Produk)" → `totals.subtotal`; "Diskon Promo Produk" → `−Rp130.000` hijau + sub "sudah diterapkan"; "Estimasi Ongkos Kirim" → GRATIS + coret `Rp25.000` + sub "Kota Tasikmalaya · radius 15 km" (atau `Rp25.000` saat subtotal < 200k); "Kemasan Proteksi & Water-bag" → GRATIS; baris kupon `−Rp25.000` bila `couponDiscount > 0`; "Total Akhir" + note "Termasuk PPn & garansi bunga mekar segar 100%".

- [ ] 3.1 Tulis `order-summary.tsx` + `coupon-field.tsx` (input placeholder "CONTOH: DELYSAWISUDA", tombol Terapkan, chip `{code}` × + "Terpasang", error `role="alert"`).
- [ ] 3.2 Wire di `cart-page.tsx`; checkout: disabled saat kosong, klik → toast "Checkout segera hadir — keranjang & ringkasanmu tersimpan."; "← Kembali Belanja Katalog" → `/katalog`; empty state (ikon ShoppingBag, copy, CTA "Jelajahi Katalog").
- [ ] 3.3 Manual: skenario mockup (650k + 2×45k) → Total Harga 740k, Diskon −130k, Ongkir GRATIS coret 25k, Total Akhir 740k; kupon salah/kosong/huruf kecil; DELYSAWISUDA → 715k; lepas chip → 740k + reload tetap lepas.
- [ ] 3.4 `format:check` + tsc + `build`; commit.

### Task 4 — Kelengkapan halaman (slot, banner tamu, progress, instruksi, responsif)

**Files:** `components/cart/delivery-slot-note.tsx` (C), `guest-banner.tsx` (C), `free-shipping-progress.tsx` (C), `cart-instructions-field.tsx` (C), `view/cart-page.tsx`

Interface kunci:
```tsx
FreeShippingProgress({ subtotal }: { subtotal: number }); // width = min(100, subtotal/FREE_SHIPPING_MIN*100)%; label sisa via formatIDR atau "100% TERCAPAI"
CartInstructionsField({ value, onChange }: { value: string; onChange: (v: string) => void }); // maxLength 300
```
- [ ] 4.1 Tulis 4 komponen; banner tamu copy "Belanja Sebagai Tamu — Masuk untuk simpan keranjang hingga 30 hari" + "Masuk / Buat Akun" (dead link gaya DeadLink).
- [ ] 4.2 Grid `lg:grid-cols-[minmax(0,1fr)_380px]` final; ringkasan `lg:sticky lg:top-24`; pass responsif 360px (tanpa scroll horizontal, tap target ≥44px).
- [ ] 4.3 Manual: progress 0%/parsial/penuh; instruksi bertahan reload; keyboard order logis; commit.

### Task 5 — Add-ons, chips bonus, simpan-untuk-nanti, integrasi PDP

**Files:** `data/cart-addons.ts` (C), `components/cart/atelier-addons.tsx` (C), `components/cart/saved-for-later.tsx` (C), `cart-line-item.tsx`, `view/product-detail-page.tsx`, `mock/products/product-detail.json`

```ts
export interface CartAddon { id: string; name: string; price: number; image: string }
export const CART_ADDONS: CartAddon[]; // Matte Basalt Ceramic Vase 185000; Artisanal Keepsake & Wax Seal 35000; Boneka Wisuda Mini Teddy UNSIL 45000; Ferrero Rocher Box (3 Pcs) 55000 — gambar via img() Unsplash (verifikasi URL render saat QA)
AtelierAddons({ lines, onAdd }: { lines: MiniCartLine[]; onAdd: (a: CartAddon) => void }); // "+ Tambah" → addLine({kind:"addon", slug:`addon:${id}`, sizeId:"-", sizeLabel:"Add-on", wrapId:"-", maxQty:10,...}); kartu jadi "Ditambahkan ✓" bila sudah ada
SavedForLater({ lines, onMoveToCart, onRemove }: {...}); // seksi collapsible "Disimpan untuk Nanti (N)"
```
- [ ] 5.1 Tulis `data/cart-addons.ts` + `atelier-addons.tsx` + `saved-for-later.tsx`.
- [ ] 5.2 Chips bonus di `cart-line-item.tsx` (`line.bonuses?.map` chip hijau).
- [ ] 5.3 PDP: `ProductDetail.bonuses?: string[]` + fixture hero `["Kartu Ucapan Kustom", "Bonus Pita Wisuda UNSIL Kuning-Emas"]`; `product-detail-page.tsx` meneruskan `originalPrice`, `bonuses`, `maxQty: data.stock`, `wrapLabel`.
- [ ] 5.4 Manual: add-ons tambah/duplikat aman; Simpan → seksi muncul persisten → pindah kembali/ hapus; chips bonus muncul di baris hero; commit.

### Task 6 — Integrasi header/drawer + harness 5-state + verifikasi final

**Files:** `components/storefront/shop-header.tsx`, `components/product/mini-cart-drawer.tsx`, `view/cart-page.tsx`, `routes/_shop/keranjang.tsx`

- [ ] 6.1 Header: tombol alert → `Link to="/keranjang"`; badge = `count` live (aria-label "Keranjang, N item").
- [ ] 6.2 Drawer: CTA "Lihat Keranjang (N) →" `/keranjang`; hapus duplikasi konstanta → `cart-rules` + `computeCartTotals` (ongkir 25.000 konsisten).
- [ ] 6.3 Harness: `?demo=loading` skeleton struktur halaman; `?demo=empty` empty state; `?demo=error` kartu `role="alert"` + "Coba lagi" (navigasi ke `/keranjang` polos).
- [ ] 6.4 Verifikasi final: `pnpm --filter client-web-delysa-florist format:check` + `exec tsc --noEmit` + `build` → 0 error; checklist AC §2 manual desktop 1440 + 360px + keyboard; commit.

## 8. Verifikasi per AC

| AC | Cara |
|---|---|
| AC-1 | Buka `/keranjang`, `?demo=loading\|empty\|error`; view-source/SSR tanpa error localStorage |
| AC-2 | ± qty, hapus → subtotal/badge/total berubah seketika (tanpa refresh) |
| AC-3 | Pilih 2 dari 3 item → indeterminate; Hapus Pilihan + Urungkan |
| AC-4 | DELYSAFIRST default; DELYSAWISUDA → −25.000; "salah" → error; lepas chip + reload |
| AC-5 | Skenario 650k + 2×45k → 740k / −130k / GRATIS / 740k |
| AC-6 | Kosongkan keranjang → empty state; CTA checkout disabled |
| AC-7 | Reload → data tetap; header badge; drawer N + ongkir 25k |
| AC-8..10 | Add-ons, chips bonus, Simpan/lanjut section |
| AC-11 | DevTools 360/768/1024/1440 |
| AC-12 | Dua perintah build di §7 Task 6 + `format:check` |

## 9. Risiko

- **Hidrasi SSR** — jangan sentuh `localStorage` di render; semua akses lewat store lazy (`subscribeCart`).
- **Toast `actionProps`** — API Base UI 1.8.0 diverifikasi saat implementasi; fallback aman dideskripsikan di Task 2.5.
- **Migrasi v1** — baca sekali; data v1 tanpa `saved/coupon/instructions` default aman (coupon default terpasang).
- **Angka mockup** — 740k berasal dari fixture skenario (650k + 2×45k + coret 60k); bukan janji data katalog saat ini (katalog punya harga sendiri).
- **Scope** — kandidat trim: §5 poin 5.
- **Checkbox a11y** — label klik area, fokus ring; verifikasi keyboard di Task 4.3.

## 10. Referensi

- Linear CP-39 (In Progress, parent CP-17) — deskripsi, AC, DoD.
- `docs/research/fe/shop.md:33-39` (§S-04), `docs/research/fe/route-map.md`.
- `docs/research/keranjang-belanja.md` — riset context7/exa + gotcha repo (sumber §5 & §7).
- PRD-FE `docs/prd/PRD-Frontend-Delysa-Florist.md` — FE-3, folder map, hard rules.
- `docs/superpowers/plans/2026-10-16-pdp-products-slug.md` — preseden format & pola.
- Image 1 (chat) — sumber visual & copywriting.

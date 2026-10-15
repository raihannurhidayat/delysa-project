# Navigasi Mobile ShopHeader: Hamburger Drawer + Search (Implementation Plan)

> **For agentic workers:** implement task-by-task. Steps use checkbox (`- [ ]`) syntax.
> Desain disetujui user di chat 2026-10-15 (pendekatan A: Dialog-extend; search fungsional).
> TIDAK ada kode feature yang ditulis di prompt ini selain sketsa antarmuka/test.

**Goal:** Pengunjung mobile (mayoritas trafik) dapat bernavigasi nyaman mulai dari
`ShopHeader`: tombol hamburger (`<md`) membuka drawer modal dari kiri berisi 7 link
navigasi + kontak + akun, dan search tampil di mobile sebagai baris kedua yang
fungsional (submit → `/katalog?search=...`). Production-grade: a11y penuh + e2e.

**Architecture:** Extend `ui/dialog.tsx` (Base UI Dialog modal: trap fokus, Esc,
backdrop, scroll-lock bawaan) dengan override class menjadi left-sheet; state
`open` controlled di `ShopHeader` + `useEffect` menutup saat `pathname` berubah
(header persisten/tidak remount — `routes/_shop/route.tsx:11-18`).

**Tech Stack:** React 19, `@tanstack/react-router@1.170.41`, Tailwind CSS 4.2.2,
`@base-ui/react@1.8.0` (Dialog), `lucide-react@1.53.0`, Playwright 1.61, pnpm 9.

**Spec:** gate desain chat 2026-10-15; riset `docs/research/navigasi-mobile-shop-header.md`.

## Global Constraints

- Tidak ada dependency baru; tidak ada perubahan `packages/shared`, API, atau skema DB.
- File route dilarang `export` komponen (aturan code-split PRD-FE, lihat plan CP-37 §Global Constraints).
- Perintah verifikasi hanya dari `apps/web/package.json`: `format:check`
  (`prettier --check "src/**/*.{ts,tsx}"`), `npx tsc --noEmit`, `pnpm build`
  (`vite build && tsc --noEmit`), `pnpm test:e2e` (`playwright test`, webServer
  auto-start di `playwright.config.ts:6-13`).
- Mobile-first: breakpoint `md:` (768px) mengikuti pola `hidden md:block` yang ada.

## 1. Ringkasan & tujuan

Satu paragraf: drawer + search mobile di `ShopHeader` saja (footer/breadcrumb/
pagination di luar scope), reuse maksimal, a11y sesuai riset (trap, Esc, fokus
kembali, target ≥44px, `aria-expanded`/`aria-controls`, reduced-motion).

## 2. Acceptance criteria

- Given viewport 390px, When halaman dibuka, Then tombol "Menu" (hamburger) terlihat
  dan nav-link horizontal desktop tersembunyi; search baris kedua terlihat.
- Given drawer tertutup, When tombol "Menu" di-tap, Then drawer geser dari kiri,
  `aria-expanded="true"`, fokus pindah ke dalam drawer, scroll background terkunci.
- Given drawer terbuka, When tap backdrop / tombol close / `Esc`, Then drawer
  menutup dan fokus kembali ke tombol "Menu".
- Given drawer terbuka, When tap link (mis. "Promo Spesial"), Then pindah route
  dan drawer menutup (tidak tertinggal terbuka karena header tidak remount).
- Given mobile, When submit search "buket wisuda", Then URL `/katalog?search=buket%20wisuda`
  dan grid terfilter (mengikuti perilaku `CatalogToolbar` yang ada).
- Given keyboard-only, When Tab dari trigger, Then seluruh drawer dapat
  dioperasikan (buka → travers → tutup via `Esc`) tanpa mouse; indikator fokus
  selalu terlihat.
- Given viewport 320px, When drawer dibuka, Then tidak ada horizontal scroll halaman;
  lebar sheet `85vw, max 20rem`.
- Given `format:check`, `tsc --noEmit`, `build`, `test:e2e`, When dijalankan,
  Then semua exit 0.

## 3. Asumsi & di luar scope

- Asumsi: sheet dari kiri `w-[85vw] max-w-80`, full-height (`h-dvh`); kontak di
  drawer reuse info Tasikmalaya/telp/IG dari header desktop; label trigger "Menu"
  + ikon (label membantu rekognisi — temuan riset §3).
- Di luar scope: footer nav, breadcrumb, pagination mobile, bottom tab bar,
  swipe-to-dismiss (ditolak: butuh `Drawer` Base UI yang dukungan side-panelnya
  tidak terverifikasi — lihat riset §5), perubahan perilaku desktop ≥md,
  debounce search mobile (submit/Enter saja, YAGNI).

## 4. Temuan repo ringkas

- Stack & struktur: monorepo pnpm; `apps/web` TanStack Start; route file-based
  `routes/_shop/` + layout persisten (`route.tsx`); fitur di
  `features/shop/{components/storefront,catalog,hooks,...}`; alias `~/` → `src`.
- Acuan pola: `shop-header.tsx` (Link + `activeProps`/`inactiveProps`,
  `NAV_BASE_CLASS` fokus rose), `useSlidingIndicator` (hormati
  `prefers-reduced-motion`, ukur offset bukan rect), `catalog-page.tsx`
  (`navigate({ search, resetScroll: false })` untuk filter), `ui/dialog.tsx`
  (`data-open:animate-in` + `motion-reduce` perlu ditambah).
- `ui/` tersedia: button, input, separator, dialog, badge — tanpa drawer/sheet.

## 5. Keputusan desain dan alternatif yang ditolak

- **Dipilih:** Extend Dialog menjadi left-sheet (detail + alasan di chat Fase 3;
  didukung riset `docs/research/navigasi-mobile-shop-header.md` §4).
- **Ditolak:** (B) komponen `Drawer` Base UI baru — dukungan panel-samping kiri
  tidak terverifikasi + tambah file/risiko; dibuka kembali hanya bila
  swipe-to-dismiss terbukti dibutuhkan (via Spike prototipe). (C) tanpa drawer —
  7 link tetap tersembunyi di scroll horizontal; bertentangan pilihan user.

## 6. Reuse Decision Table dan File Placement Map

| Kebutuhan | Keputusan | Aset/Path | Alasan |
|---|---|---|---|
| Panel modal + trap + Esc + backdrop + scroll-lock | **Reuse** | `src/components/ui/dialog.tsx` | Bawaan Dialog modal, terverifikasi context7 `/mui/base-ui` |
| Tombol hamburger/close, input search, pemisah | **Reuse** | `ui/button.tsx`, `ui/input.tsx`, `ui/separator.tsx`, ikon `Menu`/`X` lucide-react | Pola `size="icon" rounded-full` sudah dipakai header |
| Daftar link + status aktif + kontak | **Reuse** | `NAV_LINKS` + pola `Link activeProps` + info kontak di `shop-header.tsx` | Perlu `export` tipe + konstanta (extend ±2 baris) |
| Panel drawer mobile | **Create** | `src/features/shop/components/storefront/shop-mobile-nav.tsx` | Tidak ada padanan; ikut pola komponen storefront (PascalCase file, kebab-case nama file) |
| State open + tutup saat pindah route + search baris kedua | **Extend** | `src/features/shop/components/storefront/shop-header.tsx` | Header persisten → tutup manual via `useEffect(pathname)` |
| Test e2e mobile | **Create** | `apps/web/tests/mobile-nav.spec.ts` | `tests/` kosong; `testDir: './tests'` (`playwright.config.ts:4`) |

## 7. Task berurutan

### Task 1 — Test e2e merah: drawer + search mobile

- Tujuan satu kalimat: kunci perilaku mobile dalam test yang gagal sebelum implementasi.
- File: CREATE `apps/web/tests/mobile-nav.spec.ts`.
- Antarmuka (sketsa test, bukan kode feature): `test.use({ viewport: { width: 390, height: 844 } })`;
  , contoh assertion: `await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible()`,
  buka drawer → `getByRole('dialog', { name: 'Menu navigasi' })` terlihat,
  `Esc` → dialog hilang + fokus kembali ke trigger (catat: `Dialog` Base UI
  me-render `role="dialog"` — bila berbeda, sesuaikan selector setelah Task 3 dan
  catat alasannya).
- Hasil gagal yang diharapkan: `test:e2e` gagal (trigger "Menu" tidak ditemukan).
- Verifikasi: `pnpm test:e2e -- mobile-nav` → FAIL (bukti test merah).
- Titik commit: `test(e2e): red test navigasi mobile drawer + search`.

### Task 2 — Export NAV_LINKS + tipe dari shop-header

- Tujuan: jadikan daftar link reusable tanpa duplikasi.
- File: MODIFY `apps/web/src/features/shop/components/storefront/shop-header.tsx`
  (`export type ShopNavItem`, `export const NAV_LINKS`).
- Verifikasi: `npx tsc --noEmit` exit 0 + `pnpm format:check` exit 0.
- Titik commit: gabung ke Task 3 (terlalu kecil berdiri sendiri).

### Task 3 — Komponen ShopMobileNav (panel drawer)

- Tujuan: panel sheet-kiri controlled dengan daftar link + kontak.
- File: CREATE `apps/web/src/features/shop/components/storefront/shop-mobile-nav.tsx`.
- Antarmuka yang disepakati (sketsa):
  `ShopMobileNav({ open, onOpenChange, links, activeTo }: { open: boolean; onOpenChange: (open: boolean) => void; links: ShopNavItem[]; activeTo: string | null })`.
  Isi: `Dialog` controlled + `DialogTrigger` TIDAK dipakai di sini (trigger di
  header) — panel memakai `DialogPortal/Overlay/Content` dengan `className`
  override left-sheet (`fixed top-0 left-0 h-dvh w-[85vw] max-w-80` +
  `data-open/data-closed:translate-x` + `motion-reduce:transition-none`);
  `DialogTitle` "Menu navigasi"; `<nav aria-label="Navigasi seluler">` berisi
  `Link` reuse pola `activeProps`/`inactiveProps`; `Separator`; kontak reuse
  (MapPin/Phone/AtSign); tombol close `X` dengan `aria-label="Tutup menu"`;
  tiap item tap-target `min-h-11`.
- Verifikasi: `npx tsc --noEmit` + `pnpm format:check` exit 0.
- Titik commit: `feat(web): tambah panel drawer navigasi mobile`.

### Task 4 — Integrasi ShopHeader: trigger + state + search mobile

- Tujuan: hamburger + search baris kedua fungsional di `<md`, desktop tak berubah.
- File: MODIFY `apps/web/src/features/shop/components/storefront/shop-header.tsx`:
  `useState` open + `useEffect(() => setOpen(false), [pathname])`;
  trigger `Button ghost size="icon" md:hidden` dengan `aria-expanded={open}`
  + `aria-controls="mobile-nav"` + `aria-label="Menu"`;
  search baris kedua `md:hidden` reuse `Input` (form `onSubmit` →
  `navigate({ to: '/katalog', search: { search: q || undefined } })` —
  pindah route sehingga scroll-to-top default berlaku, konsisten AC Task 5 plan ini;
  bila sudah di `/katalog`, pertahankan pola `resetScroll: false` seperti
  `catalog-page.tsx:67-72`); nav horizontal desktop dibungkus `hidden md:block`.
- Verifikasi: `npx tsc --noEmit` + `format:check` exit 0; buka `/` di dev
  (mobile 390px + desktop 1280px) — drawer + search tampil/hilang sesuai breakpoint.
- Titik commit: `feat(web): hamburger drawer + search mobile di ShopHeader`.

### Task 5 — E2e hijau + assertion a11y

- Tujuan: seluruh AC §2 lolos di browser nyata.
- File: MODIFY `apps/web/tests/mobile-nav.spec.ts` (tambah bila kurang):
  assertion `aria-expanded` true/false, tutup via backdrop + `Esc`,
  fokus kembali ke trigger (`await expect(trigger).toBeFocused()`),
  tap link → URL berubah + drawer tertutup, submit search → URL
  `/katalog?search=...`, target sentuh: `boundingBox()` tiap link ≥44×44,
  `page.evaluate(() => document.documentElement.scrollWidth) <= 320` pada 320px.
- Verifikasi: `pnpm test:e2e -- mobile-nav` → PASS (semua test hijau).
- Titik commit: `test(e2e): hijau + a11y navigasi mobile`.

### Task 6 — Verifikasi penuh + self-review diff

- Tujuan: standar repo terpenuhi, tidak ada sisa di luar scope.
- Langkah: `pnpm format:check` → `npx tsc --noEmit` → `pnpm test:e2e` (penuh) →
  `pnpm build`; `git status/diff` — pastikan hanya 3 file (§6) + tidak ada
  `console.log`/secret/TODO; cek tidak ada perubahan visual desktop (bandingkan
  screenshot 1280px sebelum/sesudah bila tersedia).
- Titik commit: tidak ada (verifikasi saja).

## 8. Rencana verifikasi per acceptance criteria

| AC (§2) | Verifikasi |
|---|---|
| Trigger + search terlihat 390px | Task 1/5 e2e `toBeVisible` |
| Buka drawer + fokus + scroll-lock | Task 5 e2e (`aria-expanded`, `toBeFocused` di drawer, `body` scroll terkunci) |
| Tutup backdrop/close/Esc + fokus kembali | Task 5 e2e tiga jalur + `toBeFocused` trigger |
| Tap link pindah + menutup | Task 5 e2e URL + dialog hidden |
| Search submit → katalog terfilter | Task 5 e2e URL + grid berisi hasil |
| Keyboard-only penuh | Task 5 e2e sekuens Tab/Esc tanpa klik |
| 320px tanpa h-scroll | Task 5 e2e `scrollWidth` assertion |
| Lint/type/test/build hijau | Task 6 berurutan |

## 9. Risiko & mitigasi

- Portal Dialog + SSR TanStack Start gagal hydrate → mitigasi: verifikasi via
  `pnpm build` + e2e (bukan hanya tsc); fallback render panel non-portal bila terbukti.
- `role="dialog"` Base UI berbeda dari asumsi test → sesuaikan selector di Task 5,
  catat di commit.
- Search dari luar `/katalog`: `navigate({ to: '/katalog', search })` menimpa
  filter katalog yang ada (page reset) — diterima (perilaku search baru), dicatat
  di AC.
- Scope merayap ke footer/pagination → tolak; file diubah dikunci §6 (3 file).

## 10. Referensi

- context7 `/mui/base-ui` (Dialog modal, `initialFocus`/`finalFocus`; Drawer parts
  + swipe — side-panel tidak terverifikasi).
- context7 `/tanstack/router` (navigate `search` functional updater — dipakai
  `catalog-page.tsx`; `resetScroll: false` — dipakai Task 4 bila relevan).
- Riset: `docs/research/navigasi-mobile-shop-header.md` (exa: Shopify a11y,
  GoogleChrome navigation-drawer, MUI/UL/Sainsbury's drawer, UX Wiki hamburger).
- Repo: `shop-header.tsx`, `ui/dialog.tsx`, `_shop/route.tsx:11-18`,
  `playwright.config.ts`, plan CP-37 (konvensi §Global Constraints).

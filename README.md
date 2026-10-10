# Delysa Florist — E-Commerce Buket & Rangkaian Bunga

Monorepo aplikasi e-commerce terintegrasi untuk **Delysa Florist (Kota Tasikmalaya)**:
pelanggan memesan buket eksklusif, melacak pengiriman, dan atelier mengelola katalog,
stok, serta laporan — dalam satu kontrak API tunggal.

> **Demo frontend:** <https://delysaflorist-kota-tasikmalaya.vercel.app/>
> Rute aktif: `/` (landing), `/sign-in`, `/sign-up`.

Proyek Capstone Semester 7 Informatika. Spec penuh: `docs/prd/PRD-Delysa-Florist.md`
(+ `PRD-Frontend-`, `PRD-Backend-`, `PRD-Bridge-`). Proposal akademik:
`docs/prd/Capstone Project Delysa Florist.docx`.

## Fitur

| Status | Fitur | Keterangan |
|---|---|---|
| Selesai | Landing `/` | Halaman utama + tautan auth |
| Selesai | Sign-in `/sign-in` | Split-screen + showcase atelier, validasi Zod, mock login |
| Selesai | Sign-up `/sign-up` | Mirror sign-in (ilustrasi kiri), meter kekuatan sandi real-time, mock register |
| Rencana | Katalog | Daftar produk + pencarian + kategori (`productQuerySchema` tersedia) |
| Rencana | Keranjang | State keranjang + sinkronisasi server |
| Rencana | Checkout | Data penerima + alamat + catatan (`checkoutSchema` tersedia) |
| Rencana | Auth backend | Login/register riil via `apps/api` (saat ini mock di FE) |
| Rencana | Stok real-time | Sinkron stok atelier |
| Rencana | Laporan | Ringkasan penjualan atelier |

Skema `register`/`login`/`productQuery`/`checkout` sudah dimirror di
`packages/shared/src/schemas.ts` sebagai kontrak tunggal FE ↔ BE.

## Teknologi

| Lapisan | Teknologi | Versi |
|---|---|---|
| Runtime / package manager | Node.js (`./.nvmrc`), pnpm workspaces | Node 20, pnpm 9 |
| Web (`apps/web`) | TanStack Start + Router + Query (SSR) | Start 1.168, Router 1.170, Query 5.102 |
| Bahasa | TypeScript + React | React 19, TS 6 (web) / TS 5.5 (shared) |
| UI | Tailwind CSS, shadcn/ui di atas Base UI, lucide-react + react-icons, Inter Variable | Tailwind 4.2.2, Base UI 1.8 |
| Form & validasi | React Hook Form + Zod (`@hookform/resolvers`) | RHF 7.62, Zod 3.23.8 |
| HTTP client | redaxios | 0.5.1 |
| Kontrak (`packages/shared`) | `openapi.yaml` + `openapi-typescript` + Zod | openapi-typescript 7.4 |
| API (`apps/api`, planned) | Laravel 11 REST API + MySQL, deploy di VPS | PHP 8.2+, Composer |
| Kualitas | Prettier, Playwright (e2e), `node --test` (shared) | Playwright 1.61, Prettier 3.3.3 |
| CI/CD | GitHub Actions (`web`, `api` paralel) + Vercel (frontend) | — |

Aturan dependency: `web → shared ← api`. Dilarang cyclic.
Kontrak API tunggal: `packages/shared/openapi.yaml`
(generate via `pnpm gen:types` → `packages/shared/src/types.gen.ts`).

## Struktur

```text
apps/web/         Frontend TanStack Start (rute: /, /sign-in, /sign-up)
apps/api/         (planned) Laravel 11 REST API + MySQL — BELUM di-scaffold,
                  disiapkan di VPS / laptop BE (lihat package.json: dev:api)
packages/shared/  Kontrak tunggal: openapi.yaml + types.gen.ts + Zod schemas
.github/          CI 2 job paralel (web, api) + CODEOWNERS
docs/prd/         PRD + proposal akademik
docs/specs/       Spec per fase
```

## Setup Kontributor

Prasyarat: **Node 20** (lihat `.nvmrc`, disarankan nvm/fnm) + **pnpm 9**
(`corepack enable` bila perlu). Backend Laravel butuh mesin terpisah
(PHP 8.2+ + Composer) — frontend bisa jalan tanpanya (auth masih mock).

```bash
git clone <repo-url> delysa-project
cd delysa-project

pnpm install          # 1 lockfile di root
pnpm gen:types        # generate types dari packages/shared/openapi.yaml

cp apps/web/.env.example apps/web/.env   # lalu isi bila perlu (lihat bawah)

pnpm dev:web          # frontend dev (lihat URL di output terminal)
# pnpm dev            # web + api paralel (butuh PHP di mesin yang sama)
```

### Environment

```bash
cp apps/web/.env.example apps/web/.env
```

Isi `.env.example` (nilai publik/mock dibundel via `import.meta.env`):

- `VITE_API_URL` — base URL API (default `http://localhost:8000/api`)
- `BETTER_AUTH_SECRET` — server-only, min 32 char random, **jangan commit nilai
  nyata**; di Vercel diset via Dashboard → Project → Settings → Environment Variables

### Perintah harian

```bash
pnpm --filter client-web-delysa-florist dev           # dev server
pnpm --filter client-web-delysa-florist build         # vite build && tsc --noEmit
pnpm --filter client-web-delysa-florist exec tsc --noEmit   # typecheck
pnpm --filter client-web-delysa-florist format:check  # prettier check (ts/tsx)
pnpm --filter client-web-delysa-florist exec playwright install chromium  # sekali saja
pnpm --filter client-web-delysa-florist test:e2e      # e2e (butuh dev server, lihat playwright.config.ts)
```

### Konvensi kontribusi

- Branch: `feat/web-*`, `feat/api-*`, `chore/shared-*` (lihat tim di bawah).
- Jangan ubah kontrak tanpa sinkronisasi: ubah `openapi.yaml` → jalankan
  `pnpm gen:types` → sesuaikan Zod schema + FE/BE.
- Jalankan `format:check` + `tsc --noEmit` + `build` sebelum push.
- Jangan commit `.env` / secret / kredensial apa pun.

## CI

Push → GitHub Actions `.github/workflows/ci.yml` menjalankan job `web`
(install + typecheck + build) dan job `api` (composer validate + test) secara
independen. Job `api` di-skip bila hanya `apps/web/**` berubah via `paths-filter`.

## Tim (Bab 4.3 proposal)

- PM/Analyst, BE/DB, FE/UI, QA/Docs.

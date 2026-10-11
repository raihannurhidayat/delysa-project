# Delysa Florist — E-Commerce Buket & Rangkaian Bunga

## Tentang Proyek Ini

**Delysa Florist** adalah aplikasi e-commerce untuk toko bunga **Delysa Florist (Kota Tasikmalaya)**.
Pelanggan bisa memesan buket eksklusif dan melacak pengiriman, sedangkan atelier mengelola
katalog, stok, dan laporan — semuanya dalam satu kontrak API tunggal.

Proyek Capstone Semester 7 Informatika. Spec penuh: `docs/prd/PRD-Delysa-Florist.md`.

> **Demo frontend:** <https://delysaflorist-kota-tasikmalaya.vercel.app/>
> Rute aktif: `/` (landing), `/sign-in`, `/sign-up`.

## Teknologi

| Bagian | Isi |
|---|---|
| **Frontend** (`apps/web`) | TanStack Start + React + Tailwind CSS + shadcn/ui |
| **Backend** (`apps/api`) | Laravel 11 REST API + MySQL — *planned, belum di-scaffold* |
| **Kontrak bersama** (`packages/shared`) | `openapi.yaml` + Zod schemas (satu sumber kebenaran FE ↔ BE) |
| **Tooling** | pnpm workspaces, TypeScript, Playwright (e2e), Prettier, GitHub Actions + Vercel |

<details>
<summary>Detail versi (klik untuk buka)</summary>

| Lapisan | Teknologi | Versi |
|---|---|---|
| Runtime / package manager | Node.js (`./.nvmrc`), pnpm workspaces | Node 20, pnpm 9 |
| Web (`apps/web`) | TanStack Start + Router + Query (SSR) | Start 1.168, Router 1.170, Query 5.102 |
| Bahasa | TypeScript + React | React 19 |
| UI | Tailwind CSS, shadcn/ui di atas Base UI, lucide-react + react-icons, Inter Variable | Tailwind 4.2.2, Base UI 1.8 |
| Form & validasi | React Hook Form + Zod (`@hookform/resolvers`) | RHF 7.62, Zod 3.23.8 |
| HTTP client | redaxios | 0.5.1 |
| Kontrak (`packages/shared`) | `openapi.yaml` + `openapi-typescript` + Zod | openapi-typescript 7.4 |
| Kualitas | Prettier, Playwright (e2e), `node --test` (shared) | Playwright 1.61, Prettier 3.3.3 |
| CI/CD | GitHub Actions (`web`, `api` paralel) + Vercel (frontend) | — |

Aturan dependency: `web → shared ← api`. Dilarang cyclic.

</details>

## Struktur Proyek

```text
apps/web/         Frontend TanStack Start (rute: /, /sign-in, /sign-up)
apps/api/         (planned) Laravel 11 REST API + MySQL — BELUM di-scaffold,
                  disiapkan di VPS / laptop BE
packages/shared/  Kontrak tunggal: openapi.yaml + types.gen.ts + Zod schemas
.github/          CI 2 job paralel (web, api) + CODEOWNERS
docs/prd/         PRD + proposal akademik
docs/specs/       Spec per fase
```

## Cara Menjalankan

### 1. Prasyarat

- **Node.js 20** (lihat `.nvmrc`, disarankan pakai nvm/fnm)
- **pnpm 9** (`packageManager: pnpm@9.0.0` di `package.json` root — jika `pnpm` tidak dikenal, jalankan `corepack enable`)
- Backend Laravel butuh mesin terpisah (PHP 8.2+ + Composer) — **frontend bisa jalan tanpanya** (auth masih mock).

### 2. Install dependency di mana? Cukup di root saja ✅

Proyek ini memakai **pnpm workspaces** (`pnpm-workspace.yaml`: `apps/*` + `packages/*`) dengan
**satu lockfile di root** (`shared-workspace-lockfile=true` di `.npmrc`).

- ✅ Cukup jalankan `pnpm install` **sekali di folder root** — otomatis menginstall `apps/web` + `packages/shared` sekaligus.
- ❌ **Tidak perlu** `npm install` / `pnpm install` manual di dalam `apps/web`.
- Script sekali jalan tersedia di `package.json` root (`dev:web`, `build`, `gen:types`, `typecheck`), jadi semua perintah dijalankan dari root.

### 3. Langkah setup (dari nol sampai jalan)

```bash
git clone <repo-url> delysa-project
cd delysa-project

pnpm install          # 1x di root, menginstall web + shared sekaligus
pnpm gen:types        # generate types dari packages/shared/openapi.yaml

cp apps/web/.env.example apps/web/.env   # Windows PowerShell: Copy-Item apps/web/.env.example apps/web/.env
# lalu isi bila perlu (lihat bagian Environment di bawah)

pnpm dev:web          # jalankan frontend dev (lihat URL di output terminal)
```

> `pnpm dev` menjalankan web + api paralel, tapi saat ini `dev:api` hanya placeholder
> (`apps/api` masih kosong) — untuk harian cukup pakai `pnpm dev:web`.

### 4. Environment

```bash
cp apps/web/.env.example apps/web/.env
```

Isi `.env.example`:

- `VITE_API_URL` — base URL API (default `http://localhost:8000/api`; nilai publik/mock, dibundel via `import.meta.env`)
- `BETTER_AUTH_SECRET` — server-only, min 32 char random, **jangan commit nilai nyata**; di Vercel diset via Dashboard → Project → Settings → Environment Variables

### 5. Perintah harian

Jalankan dari **root**:

| Perintah | Fungsi |
|---|---|
| `pnpm dev:web` | Dev server frontend |
| `pnpm build` | Build production (`vite build && tsc --noEmit`) |
| `pnpm typecheck` | Type-check semua workspace |
| `pnpm lint` | Lint semua workspace |
| `pnpm test` | Test semua workspace |
| `pnpm gen:types` | Regenerate types dari `openapi.yaml` → `packages/shared/src/types.gen.ts` |

Perintah langsung ke aplikasi web (setara, via `--filter`):

```bash
pnpm --filter client-web-delysa-florist dev           # dev server
pnpm --filter client-web-delysa-florist build         # vite build && tsc --noEmit
pnpm --filter client-web-delysa-florist exec tsc --noEmit   # typecheck
pnpm --filter client-web-delysa-florist format:check  # prettier check (ts/tsx)
pnpm --filter client-web-delysa-florist exec playwright install chromium  # sekali saja
pnpm --filter client-web-delysa-florist test:e2e      # e2e (butuh dev server, lihat playwright.config.ts)
```

### 6. Troubleshooting

| Gejala | Solusi |
|---|---|
| `pnpm: command not found` | Jalankan `corepack enable`, lalu `pnpm --version` (harus v9) |
| Versi Node salah | Samakan ke Node 20 (`nvm use 20` / `fnm use 20`) sesuai `.nvmrc` |
| Error saat `pnpm install` | Hapus `node_modules` + `pnpm-lock.yaml` **jangan dihapus** — cukup `pnpm install --force` dari root |
| `.env` tidak terbaca | Pastikan file `apps/web/.env` ada (bukan hanya `.env.example`), lalu restart dev server |
| Frontend jalan tapi data mock | Wajar — backend `apps/api` belum di-scaffold, auth masih mock di FE |
| Playwright gagal (`browser not found`) | Jalankan `pnpm --filter client-web-delysa-florist exec playwright install chromium` sekali saja |

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
Ubah `openapi.yaml` → jalankan `pnpm gen:types` → sesuaikan Zod schema + FE/BE.

## Konvensi Kontribusi

- Branch: `feat/web-*`, `feat/api-*`, `chore/shared-*`.
- Jangan ubah kontrak tanpa sinkronisasi (lihat paragraf di atas).
- Jalankan `format:check` + `tsc --noEmit` + `build` sebelum push.
- Jangan commit `.env` / secret / kredensial apa pun.

## CI

Push → GitHub Actions `.github/workflows/ci.yml` menjalankan job `web`
(install + typecheck + build) dan job `api` (composer validate + test) secara
independen. Job `api` di-skip bila hanya `apps/web/**` berubah via `paths-filter`.

## Tim (Bab 4.3 proposal)

- PM/Analyst, BE/DB, FE/UI, QA/Docs.

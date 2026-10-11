# Delysa Florist — Monorepo Opsi A

E-commerce terintegrasi (katalog, keranjang, checkout, stok real-time, laporan) untuk Delysa Florist.
Spec penuh: `PRD-Delysa-Florist.md`. Proposal akademik: `Capstone Project Delysa Florist.docx`.

## Struktur (pnpm workspaces, TANPA Turborepo)

```text
apps/web/         TanStack Start + Router + Query + Tailwind + shadcn/ui + Better Auth (:3000)
apps/api/         Laravel 13 headless REST API + sqlite dev (Composer-only, :8000, deploy di VPS)
packages/shared/  Kontrak tunggal: openapi.yaml + generated types + Zod schemas
.github/          CI job paralel (web, api) + CODEOWNERS
docs/specs/       Spec per fase
```

Aturan deps: `web → shared ← api`. Dilarang cyclic. Kontrak API = `packages/shared/openapi.yaml`.

## Cara jalan (laptop dev, Node 20 + pnpm 9)

```bash
pnpm install          # 1 lockfile di root (apps/api Composer-only, di luar graph pnpm)
pnpm gen:types         # generate types dari openapi.yaml
pnpm dev:web           # TanStack Start di apps/web → http://localhost:3000
pnpm dev:api           # Laravel headless di apps/api → http://127.0.0.1:8000 (butuh PHP 8.3+composer)
pnpm dev               # web + api paralel via concurrently (opsional; perintah terpisah cukup)
```

| Layanan | Perintah | URL |
|---|---|---|
| Web (TanStack Start) | `pnpm dev:web` | http://localhost:3000 |
| API (Laravel headless) | `pnpm dev:api` | http://127.0.0.1:8000 (`/api/v1/health`, `/api/v1/products`) |

Catatan: API memakai Laravel 13 (spec Fase 0 menyebut 11 — API `install:api`/routing stabil, tanpa downgrade) dan sqlite untuk dev lokal; MySQL hanya di VPS/prod.

`pnpm dev:api` butuh `php` di PATH. Bila error `PHP binary not found`, tambahkan PHP 8.3 ke PATH
(mis. Laragon: `C:\laragon\bin\php\php-8.3.33-Win32-vs16-x64`) atau set `PHP_BIN` menunjuk ke `php.exe`
(PowerShell: `$env:PHP_BIN="...php.exe"`; cmd: `set PHP_BIN=... && pnpm dev:api`).
Kegagalan API tidak mematikan web pada `pnpm dev` (proses independen; exit code tetap non-nol).

## Env

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env   # di mesin yang ada PHP
```

Jangan commit `.env` berisi secret. `BETTER_AUTH_SECRET` min 32 char random.

## CI

Push → GitHub Actions `ci.yml` menjalankan job `web` (install + typecheck + build) dan job `api`
(composer validate + test) secara independen. Job `api` di-skip bila hanya `apps/web/**` berubah via `paths-filter`.

## Tim (Bab 4.3 proposal)

- PM/Analyst, BE/DB, FE/UI, QA/Docs. Branch: `feat/web-*`, `feat/api-*`, `chore/shared-*`.

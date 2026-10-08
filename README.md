# Delysa Florist — Monorepo Opsi A

E-commerce terintegrasi (katalog, keranjang, checkout, stok real-time, laporan) untuk Delysa Florist.
Spec penuh: `PRD-Delysa-Florist.md`. Proposal akademik: `Capstone Project Delysa Florist.docx`.

## Struktur (pnpm workspaces, TANPA Turborepo)

```text
apps/web/         TanStack Start + Router + Query + Tailwind + shadcn/ui + Better Auth
apps/api/         Laravel 11 REST API + MySQL (placeholder siap-composer, deploy di VPS)
packages/shared/  Kontrak tunggal: openapi.yaml + generated types + Zod schemas
.github/          CI 2 job paralel (web, api) + CODEOWNERS
docs/specs/       Spec per fase
```

Aturan deps: `web → shared ← api`. Dilarang cyclic. Kontrak API = `packages/shared/openapi.yaml`.

## Cara jalan (laptop dev, Node 20 + pnpm 9)

```bash
pnpm install          # 1 lockfile di root
pnpm gen:types         # generate types dari openapi.yaml
pnpm dev:web           # TanStack Start (Vite) di apps/web
# API Laravel jalan di VPS / laptop BE yang ada PHP 8.2+composer (lihat apps/api/README.md)
pnpm dev               # web + api paralel (butuh concurrently + PHP di mesin yang sama)
```

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

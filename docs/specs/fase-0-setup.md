# Spec Fase 0 — Setup Monorepo Opsi A

## Ringkasan & Tujuan

Setup monorepo pnpm workspaces tanpa Turborepo: root + shared kontrak + skeleton web + placeholder api + CI.
Tidak ada fitur bisnis. Output = fondasi runnable untuk Fase 1 (Auth).

## Acceptance Criteria

- Given fresh clone, When `pnpm install`, Then 1 lockfile root, workspace ter-link (AC1).
- When `pnpm --filter @delysa/web typecheck`, Then lolos (AC2).
- When `pnpm --filter @delysa/shared gen:types`, Then `types.gen.ts` ter-generate dari openapi valid (AC3).
- Given VPS PHP 8.2+composer, When ikuti `apps/api/README`, Then `GET /api/v1/health` → 200 `{"status":"ok"}` (AC4).
- Push → CI 2 job web/api hijau independen (AC5).

## Desain Teknis

- Root: `pnpm-workspace.yaml`, root `package.json` (concurrently), `.npmrc` workspace flags.
- Shared: `openapi.yaml` (health + products stub), `constants.ts`, `schemas.ts` (Zod).
- Web: Vite+React skeleton + pola routes/ + `auth.ts` Better Auth mysql2 stub (server-only).
- API: `composer.json` Laravel 11, `routes/api.php`, `HealthController`, `StockService::reserve` pola lockForUpdate, Dockerfile + compose MySQL 8.
- CI: `paths-filter` → job web (pnpm) / api (composer) independen.

## Verifikasi

`pnpm install` → `gen:types` → `typecheck web` → validasi JSON/YAML. PHP tidak ada lokal →
langkah api diverifikasi via CI/VPS, dinyatakan eksplisit.

## Asumsi & Di Luar Scope

Asumsi: Node 20 + pnpm 9 (terverifikasi ada); PHP tidak ada lokal (terverifikasi).
Di luar scope: katalog/checkout/auth penuh, seed produk asli, Tailwind/shadcn penuh, gateway.

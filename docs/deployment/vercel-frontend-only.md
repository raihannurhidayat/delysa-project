# Runbook: Deploy Frontend (`apps/web`) ke Vercel dari Monorepo

Scope: 1 repo GitHub → 1 Vercel Project khusus frontend (TanStack Start SSR).
API (Laravel) deploy terpisah di luar Vercel dan belum live, jadi frontend memakai mock `VITE_API_URL`.
Riset pendukung: `docs/research/vercel-deploy-frontend-only-tanstack-start.md`.
Plan: `docs/plans/2026-10-10-vercel-deploy-frontend-only.md`.

> Catatan: `docs/research/` dan `docs/plans/` saat ini ter-ignore di root `.gitignore`,
> jadi kedua file di atas tidak ter-commit kecuali `.gitignore` diubah (perlu keputusan tim).

## Prasyarat

- Node 20 (lihat `.nvmrc`), pnpm 9 (`packageManager pnpm@9.0.0`).
- Repo sudah di-push ke GitHub; branch kerja `development`.
- Akun Vercel dengan akses import repo.
- Kode sudah memenuhi: `apps/web/vite.config.ts` memuat `nitro()` dari `nitro/vite`
  (urutan plugin: `tailwindcss(), tanstackStart(), nitro(), viteReact()`),
  dan dep `nitro` tercatat di `apps/web/package.json` + `pnpm-lock.yaml`.

## 0. Gerbang lokal (wajib hijau sebelum sentuh dashboard)

```bash
pnpm install --frozen-lockfile
pnpm --filter @delysa/shared typecheck
pnpm --filter client-web-delysa-florist build
```

Bila merah, perbaiki lokal dulu — jangan debug di Vercel.

## 1. Import repo sebagai Project frontend

1. Vercel Dashboard → Add New… → Project → Import repo ini.
2. Saat konfigurasi, klik Edit pada **Root Directory** → pilih `apps/web`.
3. Pastikan **Framework Preset** terbaca `TanStack Start`.
   Bila tidak terdeteksi (kasus monorepo / riwayat preset lain), set manual via dropdown
   Project Settings. Jangan membuat `vercel.json` kecuali langkah ini gagal total —
   fallback terakhir: `vercel.json` berisi `{"framework": "tanstack-start"}`.
4. Node.js version → `20.x`. Biarkan Install/Build/Output auto-detect
   (jangan override `buildCommand`/`outputDirectory`).
5. Klik Deploy.

## 2. Environment variables

Project → Settings → Environment Variables:

| Nama | Scope | Contoh | Sifat |
|---|---|---|---|
| `VITE_API_URL` | Production, Preview, Development | `http://localhost:8000/api` (mock) | Publik, terbundel ke browser via `import.meta.env` |
| `BETTER_AUTH_SECRET` | Production, Preview, Development (nilai beda per env) | random min 32 char | **Secret, tanpa prefix `VITE_`**, hanya `process.env` server |

Aturan: tidak ada secret di variabel `VITE_*`. Setiap ubah env → **Redeploy**.
Lokal: `cp apps/web/.env.example apps/web/.env` lalu isi nilai dev (jangan commit `.env`).
Contoh key selalu merujuk ke `apps/web/.env.example` sebagai sumber kebenaran daftar key.

## 3. Verifikasi

- Buka deployment URL: `/` ter-render (SSR), navigasi `/sign-in` dan `/sign-up` tanpa 404 platform.
- Cek di 2 ukuran layar (desktop + mobile ±390px).
- Tiap PR ke `development` menghasilkan preview URL sendiri; push ke branch production → production URL.
- Bila home OK tapi rute 404: pastikan `nitro()` ada di `vite.config.ts`, lalu redeploy.
- Bila build gagal resolve `@delysa/shared`: install berjalan dari root workspace
  (default saat Root Directory `apps/web` + `pnpm-workspace.yaml`); ulangi Deploy tanpa cache
  (Vercel Dashboard → Deployments → Redeploy → jangan pakai build cache); opsi lanjutan:
  aktifkan "Include source files outside of the Root Directory".
- Bila build lokal hijau tapi Vercel merah: samakan Node 20 di Project Settings.

## 4. Menambah deployable lain nanti (`apps/api`)

Ulangi langkah 1 (Add New… → Project → Import repo yang sama → Root Directory `apps/api`).
Setiap direktori = 1 Vercel Project = 1 domain terpisah. Perubahan di luar definisi
workspace (`pnpm-workspace.yaml`) dianggap global dan men-deploy semua project.

## 5. Promosi preview → production

Via dashboard (Promote) atau CLI:

```bash
vercel
vercel promote <deployment-url>
```

atau langsung `vercel --prod` dari direktori yang sudah di-link.

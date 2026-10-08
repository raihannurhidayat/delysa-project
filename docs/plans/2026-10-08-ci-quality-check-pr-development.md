# Rencana: CI Quality Check untuk PR ke `development`

## 1. Ringkasan & tujuan

Setiap PR ke branch `development` wajib menampilkan status quality gate yang
**informatif** (tidak memblokir merge): format-check, lint, typecheck, test, build,
dan contract-drift — per-scope via job `changes` yang sudah ada. Implementasi dengan
mengubah `.github/workflows/ci.yml` (bukan file baru), plus satu script kecil di
`apps/web`. e2e Playwright dikecualikan dari gate (butuh browser di runner).

## 2. Acceptance criteria

- Given PR dibuka/sinkron ke `development`, When tab Checks dibaca, Then job
  `quality-web`, `contract-drift`, dan `quality-gate` muncul dan berjalan.
- Given PR hanya menyentuh `docs/**`, When run selesai, Then job berat ter-skip dan
  `quality-gate` tetap melapor (tidak macet Pending).
- Given push baru saat run lama masih jalan (event PR), When run baru mulai,
  Then run lama di-cancel (concurrency), kecuali event `push`.
- Given `types.gen.ts` tidak sinkron dengan `openapi.yaml`, When CI jalan,
  Then `contract-drift` merah dengan diff terlihat di log.
- Given semua gate hijau/merah, When dibaca di merge box, Then merge tetap bisa
  (informatif — tanpa branch protection required).

## 3. Asumsi & di luar scope

Asumsi: default branch protection belum mengunci required checks (keputusan pemilik
repo, di luar kode); runner `ubuntu-latest` + Node 20 + pnpm 9 (sama seperti existing);
validasi workflow hanya via run nyata di GitHub (tidak ada `act` lokal — nyatakan).
Di luar scope: job `api` (tetap skip, `apps/api` kosong), e2e di CI, merge queue,
required/blocking checks, notifikasi Slack/Discord.

## 4. Temuan repo (ringkas)

- Trigger kini: `push` + `pull_request` tanpa filter branch (`.github/workflows/ci.yml:1-4).
- Job `changes` via `dorny/paths-filter@v3` (web: `apps/web/**`, `packages/shared/**`,
  workspace+lockfile; api: `apps/api/**`).
- Web (`client-web-delysa-florist`, `apps/web/package.json:6-12`): `build` =
  `vite build && tsc --noEmit`; **tanpa** script lint/format/typecheck/test.
- Shared (`@delysa/shared`, `packages/shared/package.json:7-12`): `gen:types`
  (openapi-typescript 7), `lint` (prettier --check), `test` (`node --test`),
  `typecheck` (`tsc --noEmit`).
- Root scripts (`package.json:11-15`): `pnpm -r` untuk lint/test/typecheck (melewati
  paket tanpa script — fakta pnpm), `gen:types` via filter shared.
- `apps/web/tests` + `playwright.config.ts` ada tapi browser tak tersedia di semua
  mesin (fakta riwayat: 1 e2e gagal karena executable hilang).

## 5. Keputusan desain (disetujui) & alternatif ditolak

Pilih **ubah `ci.yml`**: trigger `pull_request → [development]` (+ `push → [development]`
agar post-merge ikut dicek), job `quality-web` + `contract-drift` + aggregator
`quality-gate` (`if: always()`), concurrency cancel-in-progress khusus event PR.
Ditolak: **workflow baru** (duplikasi setup + paths-filter drift, 2 set status) dan
**`paths:` top-level** (workflow ter-skip tidak melapor status → Pending selamanya).

## 6. Reuse Decision Table & File Placement Map

| Kebutuhan | Keputusan | Aset/Path | Alasan |
|---|---|---|---|
| Deteksi scope | **Reuse** | job `changes`, `dorny/paths-filter@v3` | sudah ada; extend filter `web` += `.github/workflows/ci.yml` agar ubah CI ikut ngetes |
| Typecheck+build web | **Reuse** | `pnpm --filter client-web-delysa-florist build` | sudah mencakup `tsc --noEmit` |
| Lint/test/typecheck shared | **Reuse** | script `lint`/`test`/`typecheck` shared | sudah ada |
| Format-check web | **Create** | `apps/web/package.json` (+ devDep `prettier`) | web belum punya; konsisten dengan shared (prettier, tanpa config file) |
| Contract-drift | **Create (job)** | job baru di `ci.yml` | `gen:types` + `git diff --exit-code -- packages/shared/src/types.gen.ts` |
| Agregator informatif | **Create (job)** | job `quality-gate` di `ci.yml` | pola `ci-ok` riset; satu status dibaca |
| e2e | **Exclude** | `test:e2e` tidak masuk gate | butuh browser runner; tetap jalan manual lokal |

File: EDIT `.github/workflows/ci.yml` (trigger, concurrency, 3 job baru, extend filter);
EDIT `apps/web/package.json` (script `format:check` + devDep prettier → lockfile update
via `pnpm install`).

## 7. Task berurutan

### T1 — Tambah format-check di `apps/web`

- Tujuan: web punya gate format seperti shared dalam 1 perintah.
- File: EDIT `apps/web/package.json` (tambah `"format:check": "prettier --check \"src/**/*.{ts,tsx}\""`
  + devDep `"prettier": "^3.3.3"` selaras shared); jalankan `pnpm install` (lockfile ikut).
- Test dulu (TDD): belum ada test untuk ini; verifikasi = `pnpm --filter
  client-web-delysa-florist exec prettier --check "src/**/*.{ts,tsx}"` → hijau
  (bila merah karena file belum rapi: `prettier --write` path yang sama, commit hasil).
- Perintah verifikasi: script baru exit 0. Titik commit: `chore(web): add format:check`.

### T2 — Ubah trigger + concurrency `ci.yml`

- Tujuan: workflow hanya peduli `development` + run basi di-cancel.
- File: EDIT `.github/workflows/ci.yml` → `on.pull_request.branches: [development]`
  (+ `types: [opened, synchronize, reopened]`), `on.push.branches: [development]`,
  tambah top-level `concurrency: {group: ${{ github.workflow }}-${{ github.ref }},
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}}`.
  Sintaks dari docs resmi (lihat §10).
- Verifikasi: baca ulang file (tidak ada runner YAML lokal — nyatakan); `git diff`
  hanya sentuh blok `on` + tambah blok `concurrency`. Titik commit: gabung T3.

### T3 — Tambah job quality + drift + aggregator

- Tujuan: full gate informatif per-scope.
- File: EDIT `.github/workflows/ci.yml`:
  - extend filter `web` += `.github/workflows/ci.yml`;
  - job `quality-web` (needs `changes`, if web): install → shared `lint`+`test`+
    `typecheck` → web `format:check` → web `build`;
  - job `contract-drift` (needs `changes`, if web): install → `gen:types` →
    `git diff --exit-code -- packages/shared/src/types.gen.ts` (merah + diff bila drift);
  - job `quality-gate` (`if: always()`, needs `[changes, quality-web, contract-drift, api]`):
    gagal bila ada `failure`/`cancelled`, pola `contains(needs.*.result, …)`.
- Verifikasi: re-read diff per job; validasi akhir via T4 (run nyata). Titik commit:
  `ci: quality gate untuk PR ke development`.

### T4 — Validasi via PR uji

- Tujuan: buktikan AC1–AC5 di GitHub nyata.
- Langkah: push branch `chore/ci-verify` (ubah 1 baris komentar/docs) → buka PR ke
  `development` → baca Checks (4 job muncul, drift hijau) → push commit pemicu drift
  (opsional: sentuh `openapi.yaml` tanpa regen) → pastikan `contract-drift` merah →
  revert, pastikan hijau → tutup PR tanpa merge (atau merge bila diinginkan).
- Hasil yang diharapkan: semua AC terpenuhi; catat URL run sebagai bukti.

## 8. Rencana verifikasi per AC

| AC | Perintah | Lolos bila |
|---|---|---|
| Gate muncul di PR | buka PR uji → Checks | 3 job baru terlihat |
| Skip docs bersih | PR hanya `docs/**` | job berat skip, gate tetap lapor |
| Cancel basi | push 2x cepat ke PR | run lama cancelled |
| Drift terdeteksi | ubah openapi tanpa regen | `contract-drift` merah + diff |
| Informatif | merge box | merge tetap bisa saat merah |

## 9. Risiko & mitigasi

- Salah sintaks workflow tanpa validasi lokal → mitigasi: edit minimal, pola disalin
  dari contoh riset yang jalan; T4 sebagai validasi final.
- `pnpm install --frozen-lockfile` gagal bila lockfile tidak sinkron setelah T1 →
  mitigasi: T1 wajib commit lockfile ter-update.
- Menit runner bertambah (install per job) → mitigasi: jaga `paths-filter` agar job
  berat skip saat tak relevan; cache pnpm via `setup-node` (sudah ada).
- Scope creep (e2e/required) → tolak; catat sebagai evolusi di luar rencana ini.

## 10. Referensi

- `docs/research/ci-quality-check-pr-development.md` (5 sumber primer).
- context7 `/websites/github_en_actions` (trigger `pull_request: branches:` + `types`).
- Repo: `.github/workflows/ci.yml`, `apps/web/package.json`, `packages/shared/package.json`,
  root `package.json`, `apps/web/playwright.config.ts`.

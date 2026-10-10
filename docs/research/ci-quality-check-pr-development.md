# Riset: CI Quality Check untuk PR ke `development`

Tanggal: 2026-10-08. Konteks: monorepo pnpm (`apps/web`, `packages/shared`, `apps/api` kosong),
workflow existing `.github/workflows/ci.yml` (trigger `push` + `pull_request` tanpa filter branch,
job `changes`/`web`/`api` via `dorny/paths-filter@v3`).

## 1. Pendekatan umum (2–3 opsi + trade-off)

**A. In-workflow path filtering (dipakai repo ini sekarang, direkomendasikan dipertahankan).**
Workflow trigger untuk semua PR/push tanpa `paths:` top-level; job `changes` ringan
(`dorny/paths-filter`) memancarkan output boolean; job berat jalan kondisional via `if:`.
Sumber primer: pola ini dipakai rjmurillo/ai-agents `ai-pr-quality-gate.yml` dan
cosmiclearn monorepo recipe. [1][2] Trade-off: (+) required/informational check tidak
pernah "Pending" selamanya; (−) workflow selalu ter-schedule walau langsung skip.

**B. Native trigger `paths:` top-level.** GitHub membandingkan tree vs base sebelum
menjadwalkan workflow. [3] Trade-off: (+) hemat run; (−) **fatal untuk quality gate**:
workflow yang di-skip tidak melaporkan status apa pun sehingga required check macet
"Pending" dan PR tidak bisa merge — tenki.cloud dan cosmiclearn eksplisit melarang pola
ini untuk gate. [3][2] → ditolak untuk feature ini.

**C. Graph-based affected (Nx/Turbo `--affected`).** Akurat transitif tanpa daftar path
manual. [4] Trade-off: (+) anti-drift; (−) butuh tool + remote cache, overkill untuk
2 paket + 1 kosong (repo ini tanpa Turbo per Opsi A). → ditolak, catat sebagai evolusi
bila paket >5.

## 2. Best practice & anti-pattern

- **Aggregator job (`ci-ok`/`monorepo-gate`)**: satu job `if: always()` + `needs:`
  semua job, gagal bila ada `failure`/`cancelled`; jadikan inilah satu-satunya status
  yang dibaca (wajib bila nanti blocking, informatif pun konsisten dibaca). [3][2]
- **Concurrency cancel-in-progress**: `group: ${{ github.workflow }}-${{ github.ref }}`,
  `cancel-in-progress: true` (khusus event PR) agar push baru membatalkan run basi;
  jangan cancel di branch rilis. [5] Nama group wajib unik per workflow. [5]
- **Skipped ≠ failure**: job ter-skip oleh `if:` melapor "Success" (tidak memblokir),
  beda dengan workflow ter-skip oleh `paths:` yang tidak melapor sama sekali. [3]
- **`!cancelled()` vs `always()`** pada job dependen: pakai `!cancelled()` agar tetap
  jalan setelah dependensi di-skip tapi berhenti bila workflow di-cancel. [3]
- **Base commit**: pada PR pakai base SHA provider (`pull_request` event), bukan
  `HEAD~1`; `dorny/paths-filter` membaca changed files dari GitHub API sehingga butuh
  permission `pull-requests: read`. [3][4]

## 3. Gotcha & batasan

- `dorny/paths-filter` butuh konteks PR (base/head); untuk `workflow_dispatch` tidak ada
  konteks ini — tidak relevan di sini (tidak dipakai). [1]
- Limitasi `paths:` top-level (lebih 3000 file berubah, push >1000 commit) tidak berlaku
  karena kita memakai opsi A. [3]
- `queue: max` tidak boleh dikombinasi dengan `cancel-in-progress: true` (validasi gagal). [5]
- Playwright e2e butuh browser (`npx playwright install`); di repo ini browser belum
  tentu ada di runner → e2e tidak cocok jadi gate wajib tahap ini (sebelumnya
  1 gagal karena executable hilang — fakta riwayat).
- `pnpm -r <script>` melewati paket tanpa script tersebut (fakta perilaku pnpm) —
  aman dipakai untuk gate lintas-paket.

## 4. Contoh nyata

- rjmurillo/ai-agents `ai-pr-quality-gate.yml`: trigger `pull_request: branches: [main]`
  + `types: [opened, synchronize, reopened]`, concurrency per-PR-number, change detection
  via `dorny/paths-filter@v3`, aggregate jobs. [1]
- tenki.cloud "Monorepo CI": workflow `quality` + `build` + `ci-ok`, concurrency
  cancel hanya untuk PR (`cancel-in-progress: ${{ github.event_name == 'pull_request' }}`). [3]

## 5. Rekomendasi

Ubah `ci.yml` existing (bukan file baru): batasi trigger ke `pull_request → development`
(+ pertahankan `push → development` agar post-merge ikut dicek), tambah job quality
(format/prettier-check, lint, typecheck, test, contract-drift `gen:types --check`),
tambah aggregator `quality-gate` informatif, tambah concurrency cancel-in-progress
khusus PR. e2e Playwright dikecualikan dari gate (jadikan manual/opsional).

Celah belum terverifikasi: menit runner riil per job di GitHub-hosted (estimasi dari lokal);
apakah `development` akan diproteksi branch protection (keputusan pemilik repo, di luar kode).

## Sumber

[1] https://github.com/rjmurillo/ai-agents/blob/c07d51d9/.github/workflows/ai-pr-quality-gate.yml
[2] https://www.cosmiclearn.com/ghactions/recipes-monorepo-strategies.php
[3] https://tenki.cloud/blog/monorepo-ci-github-actions-selective-builds
[4] https://nx.dev/docs/kb/monorepo-ci-best-practices
[5] https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/control-the-concurrency-of-workflows-and-jobs
(context7 `/websites/github_en_actions`: trigger `pull_request: branches:` + `types`)

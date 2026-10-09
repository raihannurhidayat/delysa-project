# Figma MCP Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan Figma official remote MCP ke `opencode.json` + panduan `docs/figma-mcp.md` agar agen dapat generate kode dari desain Figma Delysa, tanpa dependency/kode produk baru.

**Architecture:** Satu adapter baru (`figma`) pada seam yang sudah terbukti (`mcp` map di `opencode.json`, sejajar `linear-delysa`); OAuth/DCR + penyimpanan token sepenuhnya didelegasikan ke OpenCode. Docs meniru struktur `docs/linear-mcp.md`.

**Tech Stack:** OpenCode v1.18.x (skema config v1), Figma Remote MCP (`https://mcp.figma.com/mcp`, Streamable HTTP + OAuth), JSON.

**Spec:** Tidak ada spec terpisah — desain disepakati di chat (Fase 3): tujuan import-desain-ke-kode, varian official remote, scope `opencode.json` + docs, URL file Figma menyusul. Riset pendukung: `docs/research/figma-mcp-setup.md`.

## Global Constraints

- Skema config OpenCode **v1** (`mcp.<nama>` + `enabled`); JANGAN pakai skema v2 (`mcp.servers`/`disabled`). Floor CLI: `opencode >= 1.18`.
- Scope: hanya `opencode.json` + `docs/` — tanpa `scripts/`, tanpa kode `apps/`, tanpa dependency baru.
- Tanpa secret/token di repo; token hanya di `~/.local/share/opencode/mcp-auth.json`.
- Gaya docs mengikuti `docs/linear-mcp.md` (ID, perintah PowerShell + bash).

## Review Focus

- `opencode mcp debug figma` ditolak Figma karena OpenCode di luar MCP Catalog → perilaku yang diharapkan: error terdokumentasi + fallback diaktifkan, bukan retry buta.
- Seat Figma Starter/View → setelah ±6 tool call MCP berhenti menjawab → diharapkan ada catatan seat di docs + langkah upgrade.
- URL file Figma placeholder belum diganti URL asli → diharapkan docs jelas menandai placeholder agar tidak dikira final.
- (Cek dan tidak ditemukan lagi — hanya 3 di atas yang relevan untuk perubahan config.)

---

## Temuan repo ringkas

- Stack: pnpm 9 monorepo, `apps/web` (TanStack Start + Tailwind + shadcn `base-luma`, alias `~/components/ui`), `opencode.json` v1 dengan `mcp.linear-delysa` remote (bukti: `opencode.json`, `apps/web/package.json`, `apps/web/components.json`).
- Pola acuan: `docs/linear-mcp.md` + `scripts/linear-auth.ps1` (OAuth browser, token di luar repo).
- Konvensi docs: riset di `docs/research/*.md`, rencana di `docs/plans/YYYY-MM-DD-*.md` (keduanya tracked di git).

## Keputusan desain & alternatif yang ditolak

- **Dipilih A — entri remote di project `opencode.json` + `docs/figma-mcp.md`:** konsisten dengan seam yang ada (adapter kedua memvalidasi seam), team-shared via git, nol dep. Interface terkecil yang membawa seluruh perilaku (depth): 3 field JSON.
- Ditolak B — global config (`~/.config/opencode`): tak ter-versioning, tiap anggota mengulang setup.
- Ditolak C (primer) — wrapper komunitas lokal + PAT: pihak ketiga, butuh manajemen secret, tanpa write-to-canvas/Code Connect resmi. **Tetap sebagai fallback 1** bila R1 terjadi.
- Ditolak D (primer) — desktop server (`127.0.0.1:3845`): butuh Figma Desktop selalu jalan, untuk enterprise. **Fallback 2.**

## Reuse Decision Table

| Kebutuhan | Keputusan | Aset/Path | Alasan |
|---|---|---|---|
| Koneksi MCP remote + OAuth | **Reuse** (tambah adapter) | `opencode.json` (seam `mcp`) | OpenCode sudah menangani DCR + token; tinggal tambah entri `figma` sejajar `linear-delysa` |
| Struktur panduan setup/auth | **Reuse** (sebagai template) | `docs/linear-mcp.md` | Bagian config/auth/troubleshooting identik, tinggal ganti nama + URL + kekhususan Figma (link-based, seat limit) |
| Target codegen (komponen/UI) | **Reuse** | `apps/web/src/components/ui/`, `apps/web/src/features/` | Hasil generate wajib memakai shadcn/ui + alias `~` yang ada; tanpa komponen baru dalam plan ini |
| Entri docs baru | **Create** | `docs/figma-mcp.md` | Belum ada padanan; ikuti pola `docs/linear-mcp.md` |

## File Placement Map

- Modify `opencode.json` — tambah `mcp.figma` (`type: remote`, `url: https://mcp.figma.com/mcp`, `enabled: true`).
- Create `docs/figma-mcp.md` — panduan setup, auth, pemakaian link-based, verifikasi, troubleshooting (R1/R2), contoh prompt codegen ke `apps/web`.
- (Sudah ada, luar task) `docs/research/figma-mcp-setup.md`, file rencana ini.

---

### Task 1: Tambah entri `figma` ke `opencode.json`

**Files:**
- Modify: `opencode.json`
- Test: `powershell -NoProfile -Command "Get-Content opencode.json -Raw | ConvertFrom-Json"` (parse check)

**Interfaces:**
- Consumes: skema v1 OpenCode (`mcp.<nama>: {type, url, enabled}`), endpoint Figma `https://mcp.figma.com/mcp`.
- Produces: entri `mcp.figma` yang dipakai Task 2–3 (`opencode mcp auth figma`, `opencode mcp debug figma`).

- [ ] **Step 1: Tulis ekspektasi gagal (pre-check)** — Jalankan `opencode mcp list` dan catat bahwa server `figma` BELUM muncul.
  Run: `opencode mcp list` (dari root repo)
  Expected: daftar hanya memuat `linear-delysa`, tanpa `figma`.

- [ ] **Step 2: Tambahkan entri persis ini ke `opencode.json`** di dalam objek `mcp`, setelah `linear-delysa`:

```json
"figma": {
  "type": "remote",
  "url": "https://mcp.figma.com/mcp",
  "enabled": true
}
```

  Jangan ubah entri `linear-delysa`, `$schema`, atau format lain. Koma JSON harus valid.

- [ ] **Step 3: Verifikasi parse + kemunculan server**

  Run: `powershell -NoProfile -Command "Get-Content opencode.json -Raw | ConvertFrom-Json | Select-Object -ExpandProperty mcp | Format-List"`
  Expected: PASS — properti `figma` tampil dengan `type=remote`, `url=https://mcp.figma.com/mcp`.

  Run: `opencode mcp list`
  Expected: `figma` muncul di daftar (status `needs authentication` dapat diterima di tahap ini).

- [ ] **Step 4: Commit**

```bash
git add opencode.json
git commit -m "chore: add figma remote MCP entry"
```

### Task 2: Tulis `docs/figma-mcp.md` (mirror `docs/linear-mcp.md`)

**Files:**
- Create: `docs/figma-mcp.md`
- Test: verifikasi manual — engineer yang belum pernah setup dapat mengikuti docs tanpa bertanya (AC4).

**Interfaces:**
- Consumes: entri `mcp.figma` (Task 1), struktur `docs/linear-mcp.md`, fakta dari `docs/research/figma-mcp-setup.md` (endpoint, OAuth, link-based, seat limit 6 call, catalog risk).
- Produces: panduan final yang dirujuk Task 3 saat troubleshooting.

- [ ] **Step 1: Tulis draf gagal-ekspektasi** — pastikan file BELUM ada:
  Run: `powershell -NoProfile -Command "Test-Path docs/figma-mcp.md"`
  Expected: `False`.

- [ ] **Step 2: Buat `docs/figma-mcp.md`** dengan bagian wajib (Bahasa Indonesia, cermin `docs/linear-mcp.md`):
  1. Judul + config yang dipakai (blok JSON entri `figma` dari Task 1).
  2. Prasyarat: `opencode >= 1.18`, akun Figma + seat Dev/Full (catat limit Starter/View ≤ 6 tool call/bulan), URL file desain Delysa → tulis `FIGMA_FILE_URL_PLACEHOLDER` + catatan "ganti saat URL asli diterima".
  3. Auth: `opencode mcp auth figma` (browser → login Figma → Allow access); token di `~/.local/share/opencode/mcp-auth.json`, bukan di repo.
  4. Cek & kelola: `opencode mcp list`, `opencode mcp debug figma`, `opencode mcp logout figma`.
  5. Pakai: cara link-based (klik kanan layer → copy link to selection → paste ke prompt) + 2 contoh prompt codegen yang menarget `apps/web` (shadcn `~/components/ui`, Tailwind, alias `~`).
  6. Troubleshooting: penolakan catalog (gejala dari `mcp debug` + fallback wrapper-lokal/desktop, tanpa detail yang belum terverifikasi), token kedaluwarsa (logout → auth ulang), timeout fetch tools (`"timeout": 15000` bila perlu).

- [ ] **Step 3: Verifikasi konsistensi** — cocokkan setiap perintah/URL di docs dengan `opencode.json` (Task 1) dan sumber di `docs/research/figma-mcp-setup.md`. Tidak boleh ada nama tool Figma spesifik selain yang terverifikasi (`get_design_context` hanya sebagai contoh cek, bukan janji).
  Run: `git diff --stat && git status --short`
  Expected: hanya `opencode.json` (modified) + `docs/figma-mcp.md` (untracked); tanpa file `.env`/token.

- [ ] **Step 4: Commit**

```bash
git add docs/figma-mcp.md
git commit -m "docs: add figma MCP setup guide"
```

### Task 3: Verifikasi koneksi & auth (penentu R1)

**Files:** — (tanpa perubahan file; hasil dicatat ke rencana sebagai adendum bila menyimpang)

**Interfaces:**
- Consumes: entri `mcp.figma` (Task 1), docs (Task 2).
- Produces: status GO / FALLBACK yang menutup AC1–AC3.

- [ ] **Step 1: Diagnosa koneksi (tanpa auth dulu)**

  Run: `opencode mcp debug figma`
  Expected GO: discovery OAuth/DCR berjalan (401 → metadata → registrasi) atau koneksi HTTP OK.
  Expected FALLBACK: error eksplisit penolakan klien (tanda R1: OpenCode di luar catalog) → lanjut Step 3.

- [ ] **Step 2: Auth browser (hanya bila Step 1 GO)**

  Run: `opencode mcp auth figma`
  Expected: browser terbuka → login Figma → Allow access → `opencode mcp list` menunjukkan `figma` authenticated.
  Run: `powershell -NoProfile -Command "git status --short"`
  Expected: tidak ada token/secret yang masuk repo.

- [ ] **Step 3: Putusan + adendum (wajib salah satu)**
  - GO: catat seat Figma yang dipakai + 1 prompt uji link-based berhasil (mis. minta ringkasan 1 frame).
  - FALLBACK: pilih wrapper lokal atau desktop server, tulis adendum 5–10 baris di file rencana ini (bagian baru `## Adendum verifikasi`) + minta persetujuan user sebelum mengubah `opencode.json` lagi. Jangan implementasi fallback dalam plan ini.

---

## Rencana verifikasi per acceptance criteria

| AC | Cara verifikasi | Perintah | Hasil diharapkan |
|---|---|---|---|
| AC1 entri tampil | Task 1 Step 3 | `opencode mcp list` | `figma` terdaftar |
| AC2 auth tanpa secret di repo | Task 3 Step 2 | `opencode mcp auth figma` + `git status --short` | authenticated; repo bersih dari token |
| AC3 status koneksi jelas / fallback terdokumentasi | Task 3 Step 1+3 | `opencode mcp debug figma` | GO terdokumentasi, atau adendum fallback |
| AC4 docs mandiri | Task 2 Step 3 + uji baca 1 engineer | — | setup tanpa pertanyaan tambahan |
| AC5 tanpa dependency/kode baru | akhir semua task | `git diff --stat` | hanya `opencode.json`, `docs/figma-mcp.md` (+ riset & rencana ini) |

Urutan: Task 1 → Task 2 → Task 3 (sekuensial; Task 3 butuh manusia untuk klik OAuth di browser).

## Risiko & mitigasi

- R1 catalog allowlist (HIGH): dideteksi Task 3 Step 1; mitigasi fallback C/D + adendum, tanpa kerja spekulatif.
- R2 seat limit 6 call/bulan (HIGH): prasyarat seat di docs; mitigasi upgrade ke Dev/Full atau batasi pemakaian.
- R3 URL file belum ada (MED): placeholder eksplisit; docs final setelah URL diterima.
- R4 drift skema v2 (LOW): pin skema v1 + floor CLI 1.18 di Global Constraints.

## Referensi

- Riset: `docs/research/figma-mcp-setup.md` (8 sumber primer: Figma Developer Docs, Figma Learn, figma/mcp-server-guide, OpenCode docs via context7).
- Pola repo: `opencode.json`, `docs/linear-mcp.md`, `scripts/linear-auth.ps1`.
- Target codegen: `apps/web/src/components/ui/`, `apps/web/src/features/`, `apps/web/components.json`.

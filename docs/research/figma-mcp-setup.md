# Riset: Setup Figma MCP pada Repo Delysa (OpenCode)

Tanggal: 2026-10-09 · Status: selesai diriset, menunggu verifikasi hands-on (auth + `mcp debug`)
Metode: skill `research` dijalankan inline (tanpa subagent: subagent tidak membawa tool exa/context7);
semua klaim dirujuk ke sumber primer di bawah.

## Ringkasan (5–10 baris)

- Rekomendasi: tambah entri remote `figma` di project `opencode.json` menunjuk
  `https://mcp.figma.com/mcp` (Streamable HTTP + OAuth Figma), persis pola
  `linear-delysa` yang sudah ada. Tanpa dependency baru, tanpa kode produk.
- Risiko terbesar: Figma hanya mengizinkan klien dalam **Figma MCP Catalog**
  (VS Code, Cursor, Claude Code, …) — **OpenCode tidak tercantum** — sehingga
  OAuth/DCR bisa ditolak dan ini hanya bisa dipastikan lewat `opencode mcp debug figma`.
- Risiko kedua: seat Starter/View/Collab dibatasi **6 tool call/bulan**; tim perlu
  seat Dev/Full berbayar untuk pemakaian wajar.
- URL file desain Delysa belum diberikan user → docs memakai placeholder sampai ada URL asli.
- `sequential-thinking` MCP tidak tersedia di environment ini; penalaran dekomposisi
  dilakukan manual terstruktur (dicatat di ledger). `frontend-design` tidak dipakai
  (tidak ada perubahan UI).

## 1. Pendekatan yang dipertimbangkan (2–3 + trade-off)

### A. Official Figma Remote MCP (direkomendasikan, dipilih user)

- Endpoint tunggal yang dipublikasikan Figma: `https://mcp.figma.com/mcp`
  (Streamable HTTP). Auth via OAuth akun Figma; token tidak disimpan di repo. [S1][S2]
- Fitur terluas: extract design context, generate code dari frame terpilih,
  write-to-canvas (hanya remote, masih beta gratis), Code Connect, retrieve Make resources. [S1][S5]
- Cara pakai link-based: copy link file/selection dari Figma → paste ke prompt agen. [S3]
- Konfig generik untuk klien Streamable-HTTP lain persis pola yang dibutuhkan OpenCode:
  `{ "mcpServers": { "figma": { "url": "https://mcp.figma.com/mcp" } } }`. [S5]
- Trade-off: tunduk pada catalog allowlist (risiko R1) dan rate limit seat (risiko R2).

### B. Figma Desktop MCP Server (fallback 2)

- Berjalan lokal lewat aplikasi desktop Figma (`http://127.0.0.1:3845/mcp`),
  untuk kebutuhan organisasi/enterprise spesifik; Figma tetap merekomendasikan remote. [S2][S4]
- Trade-off: tiap developer wajib menjalankan Figma Desktop + enable Dev Mode/MCP server;
  tidak cocok untuk alur tim yang ringan. Bisa dipetakan ke entri OpenCode `type: remote`
  yang sama bila R1 memaksa.

### C. Wrapper komunitas lokal (fallback 1 bila R1 terjadi)

- Proyek komunitas (mis. `framelink`, `figma-developer-mcp`) membungkus Figma REST API
  via stdio + Personal Access Token. Tidak diverifikasi detail per proyek (di luar scope);
  dicatat hanya sebagai jalan keluar.
- Trade-off: pihak ketiga (risiko suplai), butuh manajemen secret PAT, tanpa write-to-canvas
  dan Code Connect resmi.

## 2. Best practice & anti-pattern

- Pakai **remote server** kecuali ada alasan enterprise spesifik (posisi resmi Figma). [S2]
- Jangan commit token/secret: pola OpenCode menyimpan token OAuth di
  `~/.local/share/opencode/mcp-auth.json`, di luar repo (sama seperti `docs/linear-mcp.md`). [S6]
- Untuk kualitas codegen: beri agen **link selection senodal mungkin** (bukan seluruh file),
  dan pasang Code Connect agar output memakai komponen `~/components/ui` yang sudah ada. [S1][S3]
- Anti-pattern: menempel URL file Figma privat ke docs publik; repo ini privat tim,
  tetap gunakan placeholder sampai user memberi URL yang boleh dicantumkan.

## 3. Gotcha, isu terbuka, limit, keamanan

- **R1 — Catalog allowlist (HIGH, belum terjawab):** "Only clients listed in the Figma MCP
  Catalog … can connect to the Figma MCP Server" — daftar terpublikasi tidak memuat OpenCode
  (tercantum: VS Code, Cursor, Claude Code, Codex, Gemini CLI, Xcode, dsb.). [S1][S4]
  Verifikasi: `opencode mcp debug figma` di Task 3 rencana.
- **R2 — Rate limit seat (HIGH):** Starter/View/Collab ≤ 6 tool call per bulan; seat Dev/Full
  (Professional/Organization/Enterprise) mengikuti limit Tier 1 REST API per menit. [S5]
  Tim mahasiswa kemungkinan di Starter → konfirmasi jenis seat sebelum mengandalkan MCP.
- **R3 — Write-to-canvas berbayar ke depan:** saat ini gratis selama beta. [S5]
- Keamanan: OAuth via browser + DCR (RFC 7591) ditangani OpenCode otomatis; tidak ada
  client secret di repo. `opencode mcp logout figma` untuk rotasi/pindah akun. [S6]
- Timeout default fetch tools OpenCode 5000 ms; server idle yang lambat bisa perlu
  `"timeout": 15000` (pola umum remote MCP, bukan khusus Figma). [S7]

## 4. Contoh implementasi nyata

- Kode ESG Figma `figma/mcp-server-guide` (github.com/figma/mcp-server-guide) memuat
  konfigurasi per klien + skills (implement designs, Code Connect, design-system rules). [S5]
- Pola dalam repo ini sendiri: `opencode.json` + `docs/linear-mcp.md` +
  `scripts/linear-auth.{ps1,sh}` untuk Linear remote MCP — menjadi template langsung. [S8]

## 5. API yang akan dipakai (terverifikasi context7, opencode v1)

`opencode.json` (skema v1, sesuai CLI lokal 1.18.35 dan `opencode.json` repo):

```json
"figma": { "type": "remote", "url": "https://mcp.figma.com/mcp", "enabled": true }
```

Opsi `type`/`url` wajib; `enabled`, `headers`, `oauth`, `timeout` opsional;
OAuth otomatis via DCR bila server mendukung; CLI: `opencode mcp auth figma`,
`opencode mcp list`, `opencode mcp debug figma`, `opencode mcp logout figma`. [S6]

> Catatan skema: docs v2 OpenCode memakai `mcp.servers` + `disabled` — **tidak berlaku**
> untuk repo ini (v1.18.x). Rencana mem-pin skema v1.

## 6. Hasil verifikasi hands-on (2026-10-09 — R1 TERKONFIRMASI)

- `opencode mcp debug figma` (2x, diselingi `logout`): selalu 401 + metadata valid,
  DCR selalu "sukses" tetapi tiap kali menerbitkan Client ID berbeda —
  ID tersebut tidak dikenali `figma.com/oauth` saat `mcp auth`.
- Error user: `OAuth app with client id … doesn't exist` — identik dengan laporan
  Antigravity CLI [S9], Kilo Code [S10], VS Code generik [S12].
- Akar masalah: Figma me-allowlist `client_name` pada DCR; "right now, opencode
  isn't on that list" (dukungan Figma, via [S11]); staf Figma: akses MCP dibatasi
  untuk klien yang didukung, penambahan klien baru dijeda, tersedia waitlist [S10].
- Konsekuensi: pendekatan A (remote) **gagal untuk OpenCode**; fallback/B-C
  naik menjadi opsi utama. Remote tetap valid untuk klien dalam katalog
  (Cursor/VS Code/Claude Code) bila tim ingin memakai editor itu berdampingan.

## Sumber (lanjutan)

- [S1] Figma Developer Docs — Remote server installation:
  <https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/>
- [S2] Figma Developer Docs — Introduction (remote disarankan; desktop untuk org/enterprise):
  <https://developers.figma.com/docs/figma-mcp-server/>
- [S3] Figma Learn — How to set up the Figma remote MCP server (link-based usage):
  <https://help.figma.com/hc/en-us/articles/35281350665623-Figma-MCP-collection-How-to-set-up-the-Figma-remote-MCP-server>
- [S4] Figma Learn — Guide to the Figma MCP server (tabel klien + endpoint):
  <https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server>
- [S5] figma/mcp-server-guide README (fitur, rate limit, konfigurasi generik):
  <https://github.com/figma/mcp-server-guide/blob/HEAD/README.md>
- [S6] OpenCode Docs — MCP servers (skema remote, OAuth/DCR, CLI auth; terverifikasi context7):
  <https://opencode.ai/docs/mcp-servers/>
- [S7] Panduan komunitas — troubleshooting `type: remote`, timeout, `mcp debug`:
  <https://tempreon.com/guides/add-mcp-server-to-opencode>
- [S8] Bukti repo: `opencode.json`, `docs/linear-mcp.md`, `scripts/linear-auth.ps1`
- [S9] Antigravity CLI issue — error identik + analisis fallback client ID:
  <https://github.com/google-antigravity/antigravity-cli/issues/496>
- [S10] Figma Forum — Kilo Code 403 di `/v1/oauth/mcp/register`, staf konfirmasi allowlist + jeda:
  <https://forum.figma.com/report-a-problem-6/cannot-connect-mcp-to-kilo-code-52379>
- [S11] Analisis allowlist DCR Figma ("opencode isn't on that list"):
  <https://www.linkedin.com/posts/cjellick_sep-991-enable-url-based-client-registration-activity-7500592418162081792-g3Tp>
- [S12] Figma Forum — VS Code generik error client ID identik, Cursor berhasil:
  <http://code.python88.com/l/VEjDhE2oFL>

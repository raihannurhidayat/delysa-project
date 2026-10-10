# Figma MCP — Setup & Auth (OpenCode)

Config per-project sudah ada di `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "figma": {
      "type": "remote",
      "url": "https://mcp.figma.com/mcp",
      "enabled": true
    }
  }
}
```

Ini memakai official Figma Remote MCP (`https://mcp.figma.com/mcp`,
Streamable HTTP, direkomendasikan Figma) dengan OAuth akun Figma.
Token **tidak** disimpan di repo, melainkan di
`~/.local/share/opencode/mcp-auth.json` (pola yang sama seperti
`docs/linear-mcp.md`).

## Prasyarat

- `opencode >= 1.18` (remote MCP + `mcp auth`). Cek: `opencode --version`.
  Repo ini memakai skema config v1 (`mcp.<nama>` + `enabled`).
- Akun Figma dengan akses ke file desain Delysa. Perhatian seat:
  seat Starter/View/Collab dibatasi ±6 tool call per bulan; untuk pemakaian
  wajar butuh seat Dev/Full (paket Professional/Organization/Enterprise).
- URL file desain Delysa: `FIGMA_FILE_URL_PLACEHOLDER`
  (ganti dengan URL asli setelah diterima dari tim desain).

## Auth — tinggal panggil ini dari root repo

```bash
opencode mcp auth figma
```

Browser akan terbuka → login Figma → Allow access.
Token disimpan aman di `~/.local/share/opencode/mcp-auth.json`
(tidak di repo).

## Cek & kelola

```bash
opencode mcp list                  # lihat status auth (figma: authenticated bila sukses)
opencode mcp debug figma           # diagnosa koneksi/OAuth
opencode mcp logout figma          # hapus token, untuk ganti akun
```

Ganti akun: `opencode mcp logout figma` lalu `opencode mcp auth figma`
lagi dan login dengan akun lain saat OAuth.

## Pakai di OpenCode

Figma MCP bersifat link-based: copy link file/selection dari Figma,
paste ke prompt agen.

1. Di Figma: klik kanan layer/frame → copy link to selection
   (atau copy URL dari address bar untuk seluruh file, sudah termasuk node ID).
2. Di sesi OpenCode, contoh prompt:

```
implementasikan frame ini menjadi komponen React + Tailwind,
pakai shadcn/ui dari ~/components/ui dan alias path ~/
sesuai apps/web: <paste-link-figma-di-sini>
```

```
buatkan daftar variabel (warna, spacing, tipografi) dari file ini
sebagai design tokens yang konsisten dengan src/styles/app.css:
<paste-link-figma-di-sini>
```

Setelah auth sukses, bisa juga prompt natural, misal:

```
list-kan tools figma yang tersedia via figma
```

## Catatan

- Klien di luar Figma MCP Catalog (termasuk OpenCode) berpotensi ditolak
  saat OAuth/DCR. Bila `opencode mcp debug figma` menunjukkan penolakan
  klien, catat error-nya dan bahas fallback (wrapper lokal / desktop server)
  sebelum mengubah config. Detail riset: `docs/research/figma-mcp-setup.md`.
- Mode desktop (fallback, butuh aplikasi Figma Desktop + Dev Mode):
  enable MCP server di Figma Desktop, lalu arahkan entri remote ke URL
  lokal yang ditampilkan (mis. `http://127.0.0.1:3845/mcp`).
- Troubleshooting umum: token kedaluwarsa → `opencode mcp logout figma`
  lalu auth ulang; fetch tools timeout (default 5000 ms) → tambah
  `"timeout": 15000` pada entri `figma` di `opencode.json`.
- Jangan commit URL file privat ke repo publik; repo ini privat tim,
  tetap pastikan placeholder di atas sudah diganti URL yang disetujui.

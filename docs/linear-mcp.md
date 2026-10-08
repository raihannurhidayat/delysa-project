# Linear MCP — Setup & Auth (OpenCode)

Config per-project sudah ada di `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "linear-delysa": {
      "type": "remote",
      "url": "https://mcp.linear.app/mcp",
      "enabled": true
    }
  }
}
```

Ini memakai official Linear MCP (`https://mcp.linear.app/mcp`, read-write)
dengan OAuth 2.1 + dynamic client registration. Token **tidak** disimpan
di repo, melainkan di `~/.local/share/opencode/mcp-auth.json`.

## Auth — tinggal panggil ini dari root repo

```bash
opencode mcp auth linear-delysa
```

Browser akan terbuka → login Linear → pilih workspace Delysa → Authorize.

Wrapper opsional (sama saja, hanya memanggil perintah di atas):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/linear-auth.ps1
```

```bash
bash scripts/linear-auth.sh
```

## Cek & kelola

```bash
opencode mcp list                  # lihat status auth
opencode mcp debug linear-delysa   # diagnosa koneksi/OAuth
opencode mcp logout linear-delysa  # hapus token, untuk ganti workspace
```

Ganti workspace: `opencode mcp logout linear-delysa` lalu
`opencode mcp auth linear-delysa` lagi dan pilih workspace lain saat OAuth.

## Pakai di OpenCode

Setelah auth sukses, di sesi OpenCode tinggal prompt natural, misal:

```
list-kan issue Linear saya via linear-delysa
```

atau eksplisit: `use linear-delysa ...`.

## Catatan

- Butuh `opencode >= 1.18` (remote MCP + `mcp auth`). Cek: `opencode --version`.
- Mode read-only (opsional): ganti URL ke `https://mcp.linear.app/mcp/readonly`
  di `opencode.json` jika agen hanya boleh baca.
- Troubleshooting `internal server error` saat connect (info resmi Linear):
  `rm -rf ~/.mcp-auth` lalu auth ulang, dan pastikan Node versi baru.

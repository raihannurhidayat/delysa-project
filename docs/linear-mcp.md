# Linear MCP — Setup & Auth (OpenCode)

Config per-project sudah ada di `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "linear": {
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

## Auth sekali panggil (pilih salah satu)

```powershell
# Windows PowerShell (repo root)
powershell -ExecutionPolicy Bypass -File scripts/linear-auth.ps1

# atau via pnpm (semua OS)
pnpm mcp:linear:auth
```

```bash
# Linux / macOS / WSL / Git-Bash
bash scripts/linear-auth.sh
```

Browser akan terbuka → login Linear → pilih workspace → Authorize.

## Cek & kelola

```bash
pnpm mcp:linear:list    # = opencode mcp list (lihat status auth)
pnpm mcp:linear:debug   # = opencode mcp debug linear (diagnosa koneksi/OAuth)
pnpm mcp:linear:logout  # = opencode mcp logout linear (hapus token, ganti workspace)
```

Ganti workspace: `pnpm mcp:linear:logout` lalu `pnpm mcp:linear:auth` lagi
dan pilih workspace lain saat OAuth.

## Pakai di OpenCode

Setelah auth sukses, di sesi OpenCode tinggal prompt natural, misal:

```
list-kan issue Linear saya via linear
```

atau eksplisit: `use linear ...`.

## Catatan

- Butuh `opencode >= 1.18` (remote MCP + `mcp auth`). Cek: `opencode --version`.
- Butuh Node.js (untuk `opencode` CLI itu sendiri, bukan `mcp-remote` —
  mode `remote` tidak perlu `npx`).
- Mode read-only (opsional): ganti URL ke `https://mcp.linear.app/mcp/readonly`
  di `opencode.json` jika agen hanya boleh baca.
- Alternatif API key (tanpa OAuth, untuk CI/bot): buat Personal API key di
  Linear Settings → Security & Access, lalu pakai header
  `Authorization: Bearer lin_api_...`. Tidak diset default agar flow utama
  tetap OAuth per-workspace.
- Troubleshooting `internal server error` saat connect (info resmi Linear):
  `rm -rf ~/.mcp-auth` lalu auth ulang, dan pastikan Node versi baru.

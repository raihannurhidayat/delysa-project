# Auth Linear MCP via OAuth (browser) — Windows PowerShell
# Cara pakai dari root repo:
#   powershell -ExecutionPolicy Bypass -File scripts/linear-auth.ps1
#   # atau: pnpm mcp:linear:auth
#
# Script ini memanggil: opencode mcp auth linear
# Browser akan terbuka -> login Linear -> pilih workspace -> authorize.
# Token disimpan aman di ~/.local/share/opencode/mcp-auth.json (tidak di repo).

$ErrorActionPreference = "Stop"

if (-not (Get-Command opencode -ErrorAction SilentlyContinue)) {
  Write-Host "opencode CLI tidak ditemukan. Install dulu: https://opencode.ai/docs" -ForegroundColor Red
  exit 1
}

Write-Host "Auth ke Linear workspace via OAuth..." -ForegroundColor Cyan
Write-Host "Config dipakai: ./opencode.json (mcp.linear -> https://mcp.linear.app/mcp)" -ForegroundColor Gray

& opencode mcp auth linear
if ($?) {
  Write-Host ""
  Write-Host "Selesai. Cek status dengan:" -ForegroundColor Green
  Write-Host "  opencode mcp list            # atau pnpm mcp:linear:list"
  Write-Host "  opencode mcp debug linear    # atau pnpm mcp:linear:debug"
}

#!/usr/bin/env bash
# Auth Linear MCP via OAuth (browser) — Linux/macOS/WSL/Git-Bash
# Cara pakai dari root repo:
#   bash scripts/linear-auth.sh
#   # atau: pnpm mcp:linear:auth
#
# Browser akan terbuka -> login Linear -> pilih workspace -> authorize.
# Token disimpan aman di ~/.local/share/opencode/mcp-auth.json (tidak di repo).
set -e

if ! command -v opencode >/dev/null 2>&1; then
  echo "opencode CLI tidak ditemukan. Install dulu: https://opencode.ai/docs" >&2
  exit 1
fi

echo "Auth ke Linear workspace via OAuth..."
echo "Config dipakai: ./opencode.json (mcp.linear -> https://mcp.linear.app/mcp)"

opencode mcp auth linear

echo ""
echo "Selesai. Cek status dengan:"
echo "  opencode mcp list            # atau pnpm mcp:linear:list"
echo "  opencode mcp debug linear    # atau pnpm mcp:linear:debug"

const INVALID_AGE = "—";

function parseDate(value: string): Date | null {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp);
}

/** Umur order relatif, mis. "18 menit lalu", "2.2 jam lalu", "3 hari lalu". */
export function formatRelativeAge(now: Date, createdAt: string): string {
  const date = parseDate(createdAt);
  if (!date) return INVALID_AGE;

  const diffMinutes = (now.getTime() - date.getTime()) / 60_000;
  if (diffMinutes < 1) return "baru saja";
  if (diffMinutes < 60) {
    return `${Math.round(diffMinutes)} menit lalu`;
  }

  const diffHours = diffMinutes / 60;
  if (diffHours < 2) {
    return `${Math.round(diffHours)} jam lalu`;
  }
  if (diffHours < 72) {
    const tenths = Math.round(diffHours * 10);
    const isWhole = tenths % 10 === 0;
    return `${(tenths / 10).toFixed(isWhole ? 0 : 1)} jam lalu`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} hari lalu`;
}

/** Ringkasan item ala Gambar 1: "4 item: Monolith Peach + Sunflower". */
export function summarizeItems(
  items: readonly { name: string; qty: number }[],
): string {
  if (items.length === 0) return "Tidak ada item";

  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const MAX_NAMES = 2;
  const names = items.slice(0, MAX_NAMES).map((item) => item.name);
  const remainder = items.length - names.length;
  const suffix = remainder > 0 ? ` + ${remainder} lainnya` : "";

  return `${totalQty} item: ${names.join(" + ")}${suffix}`;
}

/** Alamat satu-baris untuk kolom pelanggan. */
export function shortAddress(address: string, maxLen = 28): string {
  const trimmed = address.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen).trimEnd()}…`;
}

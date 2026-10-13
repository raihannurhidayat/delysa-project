const idrFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

/** Format rupiah tanpa desimal: 195000 → "Rp195.000". */
export function formatIDR(value: number): string {
  return `Rp${idrFormatter.format(value)}`;
}

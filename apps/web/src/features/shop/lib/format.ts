const idrFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

/** Format rupiah tanpa desimal: 195000 → "Rp195.000". */
export function formatIDR(value: number): string {
  return `Rp${idrFormatter.format(value)}`;
}

/** Format angka terjual: 1200 → "1,2rb", 860 → "860". */
export function formatSold(sold: number): string {
  return sold >= 1000
    ? `${(sold / 1000).toFixed(1).replace(".", ",")}rb`
    : `${sold}`;
}

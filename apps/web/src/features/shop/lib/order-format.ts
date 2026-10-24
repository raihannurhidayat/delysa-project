const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const INVALID_DATE = "Tanggal tidak tersedia";

function parseDate(value: string): Date | null {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp);
}

export function formatOrderDate(value: string): string {
  const date = parseDate(value);
  if (!date) return INVALID_DATE;
  const day = dateFormatter.format(date);
  const time = timeFormatter.format(date).replace(/\./g, ":");
  return `${day}, ${time} WIB`;
}

export function formatOrderShortDate(value: string): string {
  const date = parseDate(value);
  if (!date) return INVALID_DATE;
  return dateFormatter.format(date);
}

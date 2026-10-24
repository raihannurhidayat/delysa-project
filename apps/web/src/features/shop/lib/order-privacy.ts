export function maskOrderName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "Pelanggan";

  const words = trimmed.split(/\s+/);
  if (words.length === 1) {
    return `${words[0].charAt(0)}***`;
  }

  const lastWord = words[words.length - 1];
  return `${words[0]} ${lastWord.charAt(0)}***`;
}

export function maskOrderPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 6) return "****";
  return `${digits.slice(0, 4)}****${digits.slice(-3)}`;
}

export function maskOrderAddress(address: string): string {
  const area = address.split(",").at(-1)?.trim() ?? "";
  if (!area) return "Alamat disembunyikan";
  return `${area}, alamat lengkap disembunyikan`;
}

export type PasswordStrength = {
  /** Skor 0–4: jumlah bar yang terisi. */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
};

const LABELS: Record<PasswordStrength["score"], string> = {
  0: "Sangat Lemah",
  1: "Lemah",
  2: "Sedang",
  3: "Kuat",
  4: "Kuat & Aman",
};

/**
 * Skor kekuatan kata sandi dari panjang + variasi karakter.
 * Murni (tanpa side effect) agar mudah dites.
 */
export function getPasswordStrength(password: string): PasswordStrength {
  let points = 0;
  if (password.length >= 8) points += 1;
  if (password.length >= 12) points += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) points += 1;

  const score = Math.min(points, 4) as PasswordStrength["score"];
  return { score, label: LABELS[score] };
}

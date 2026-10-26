import type { Role } from "@delysa/shared";

export const ROLE_HOME = {
  customer: "/akun",
  store_owner: "/toko",
  admin: "/admin",
} as const satisfies Record<Role, string>;

export const ROLE_LABEL: Record<Role, string> = {
  customer: "Pelanggan",
  store_owner: "Pemilik Toko",
  admin: "Admin",
};

export function roleHome(role: Role): (typeof ROLE_HOME)[Role] {
  return ROLE_HOME[role];
}

export function roleLabel(role: Role): string {
  return ROLE_LABEL[role];
}

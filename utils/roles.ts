export const ROLE_ADMIN = 'admin';
export const ROLE_CUSTOMER = 'customer';

export type UserRole = typeof ROLE_ADMIN | typeof ROLE_CUSTOMER;

export function normalizeRole(role?: string | null): UserRole {
  return role === ROLE_ADMIN ? ROLE_ADMIN : ROLE_CUSTOMER;
}

export function isAdmin(user?: { role?: string | null } | null): boolean {
  return normalizeRole(user?.role) === ROLE_ADMIN;
}

export function roleLabel(role?: string | null): string {
  return normalizeRole(role) === ROLE_ADMIN ? 'Admin' : 'Pelanggan';
}

export const ADMIN_EMAIL = 'graficacovacimprenta@gmail.com';

export function isSuperadmin(email?: string | null): boolean {
  return (email ?? '').toLowerCase() === ADMIN_EMAIL;
}

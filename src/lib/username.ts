const USERNAME_DOMAIN = 'kioskogo.app';

export function toAuthEmail(identifier: string): string {
  const value = identifier.trim().toLowerCase();
  if (!value) return value;
  return value.includes('@') ? value : `${value}@${USERNAME_DOMAIN}`;
}

export function displayUserEmail(email: string | null | undefined): string {
  if (!email) return '—';
  const suffix = `@${USERNAME_DOMAIN}`;
  if (email.endsWith(suffix)) return email.slice(0, -suffix.length);
  return email;
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_.]{3,20}$/.test(username.trim().toLowerCase());
}

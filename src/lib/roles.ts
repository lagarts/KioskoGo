import type { UserRole } from '../types';

export const CAJERO_ALLOWED_PATHS = ['/cash', '/sales/new', '/barcode'];

export function canAccessPath(role: UserRole, path: string): boolean {
  if (role !== 'cajero') return true;
  return CAJERO_ALLOWED_PATHS.includes(path);
}

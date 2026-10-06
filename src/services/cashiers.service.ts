import { supabase } from '../lib/supabase';
import { toAuthEmail } from '../lib/username';
import type { User } from '../types';

export async function createCashier(identifier: string, name: string, password: string): Promise<void> {
  const { error } = await supabase.rpc('admin_create_cashier', {
    p_email: toAuthEmail(identifier),
    p_name: name,
    p_password: password,
  });
  if (error) {
    throw new Error(
      error.message.includes('ya está registrado') ? 'Ese usuario ya existe' : error.message
    );
  }
}

export async function listCashiers(businessId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('business_id', businessId)
    .eq('role', 'cajero')
    .order('created_at');
  if (error) throw new Error(error.message);
  return (data ?? []) as User[];
}

export async function removeCashier(userId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_remove_cashier', { p_user_id: userId });
  if (error) throw new Error(error.message);
}

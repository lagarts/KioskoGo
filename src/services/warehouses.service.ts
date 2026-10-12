import { supabase } from '../lib/supabase';
import type { Warehouse } from '../types';

export async function listWarehouses(): Promise<Warehouse[]> {
  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .order('is_default', { ascending: false })
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as Warehouse[];
}

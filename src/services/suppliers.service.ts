import { supabase } from '../lib/supabase';
import type { Supplier } from '../types';

export interface SupplierInput {
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  cuit?: string;
  notes?: string;
}

export async function listSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase.from('suppliers').select('*').order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as Supplier[];
}

export async function createSupplier(input: SupplierInput, businessId: string): Promise<Supplier> {
  const { data, error } = await supabase
    .from('suppliers')
    .insert({ ...input, business_id: businessId })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as Supplier;
}

export async function updateSupplier(id: string, input: SupplierInput): Promise<void> {
  const { error } = await supabase.from('suppliers').update(input).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteSupplier(id: string): Promise<void> {
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

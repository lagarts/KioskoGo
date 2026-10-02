import { supabase } from '../lib/supabase';
import type { Customer } from '../types';

export interface CustomerInput {
  name: string;
  phone?: string;
  email?: string;
  dni?: string;
  cuit?: string;
  address?: string;
  notes?: string;
}

export async function listCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from('customers').select('*').order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as Customer[];
}

export async function createCustomer(input: CustomerInput, businessId: string): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert({ ...input, business_id: businessId })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as Customer;
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<void> {
  const { error } = await supabase.from('customers').update(input).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function payCustomerBalance(customerId: string, amount: number): Promise<number> {
  const { data, error } = await supabase.rpc('pay_customer_balance', {
    p_customer_id: customerId,
    p_amount: amount,
  });
  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}

import { supabase } from '../lib/supabase';
import type { CashMovement, CashRegister } from '../types';

export async function getOpenRegister(): Promise<CashRegister | null> {
  const { data, error } = await supabase
    .from('cash_registers')
    .select('*')
    .eq('status', 'open')
    .order('opened_at', { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return data && data.length > 0 ? (data[0] as CashRegister) : null;
}

export async function openRegister(
  openingAmount: number,
  userId: string,
  businessId: string,
  branchId?: string | null
): Promise<CashRegister> {
  const { data, error } = await supabase
    .from('cash_registers')
    .insert({
      name: 'Caja Principal',
      user_id: userId,
      status: 'open',
      opening_amount: openingAmount,
      branch_id: branchId ?? null,
      business_id: businessId,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  const register = data as CashRegister;
  const { error: movError } = await supabase.from('cash_movements').insert({
    cash_register_id: register.id,
    type: 'opening',
    amount: openingAmount,
    description: 'Apertura de caja',
    user_id: userId,
  });
  if (movError) throw new Error(movError.message);
  return register;
}

export async function closeRegister(
  register: CashRegister,
  closingAmount: number,
  expectedAmount: number,
  userId: string,
  observations?: string
): Promise<void> {
  const { error } = await supabase
    .from('cash_registers')
    .update({
      status: 'closed',
      closing_amount: closingAmount,
      expected_amount: expectedAmount,
      difference: closingAmount - expectedAmount,
      observations: observations || null,
      closed_at: new Date().toISOString(),
    })
    .eq('id', register.id);
  if (error) throw new Error(error.message);

  const { error: movError } = await supabase.from('cash_movements').insert({
    cash_register_id: register.id,
    type: 'closing',
    amount: closingAmount,
    description: 'Cierre de caja',
    user_id: userId,
  });
  if (movError) throw new Error(movError.message);
}

export async function listMovements(registerId: string): Promise<CashMovement[]> {
  const { data, error } = await supabase
    .from('cash_movements')
    .select('*')
    .eq('cash_register_id', registerId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CashMovement[];
}

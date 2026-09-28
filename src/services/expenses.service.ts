import { supabase } from '../lib/supabase';
import type { Expense } from '../types';

export interface ExpenseInput {
  category: string;
  amount: number;
  description?: string;
  date: string;
}

export async function listExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Expense[];
}

export async function createExpense(input: ExpenseInput, userId: string, businessId: string): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...input, user_id: userId, business_id: businessId })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as Expense;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

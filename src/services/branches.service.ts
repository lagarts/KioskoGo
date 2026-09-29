import { supabase } from '../lib/supabase';
import type { Branch } from '../types';

export interface BranchInput {
  name: string;
  address?: string;
}

export async function listBranches(): Promise<Branch[]> {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .order('created_at');
  if (error) throw new Error(error.message);
  return (data ?? []) as Branch[];
}

export async function createBranch(input: BranchInput, businessId: string): Promise<void> {
  const { error } = await supabase
    .from('branches')
    .insert({ ...input, business_id: businessId });
  if (error) throw new Error(error.message);
}

export async function updateBranch(id: string, input: Partial<BranchInput> & { active?: boolean }): Promise<void> {
  const { error } = await supabase.from('branches').update(input).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteBranch(id: string): Promise<void> {
  const { error } = await supabase.from('branches').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getProductBranches(productId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('product_branches')
    .select('branch_id')
    .eq('product_id', productId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.branch_id as string);
}

export async function setProductBranches(productId: string, branchIds: string[]): Promise<void> {
  const { error: delError } = await supabase
    .from('product_branches')
    .delete()
    .eq('product_id', productId);
  if (delError) throw new Error(delError.message);
  if (branchIds.length === 0) return;
  const { error: insError } = await supabase
    .from('product_branches')
    .insert(branchIds.map((branchId) => ({ product_id: productId, branch_id: branchId })));
  if (insError) throw new Error(insError.message);
}

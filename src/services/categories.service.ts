import { supabase } from '../lib/supabase';
import type { Category } from '../types';

export interface CategoryWithCount extends Category {
  productCount: number;
}

export interface CategoryInput {
  name: string;
  icon?: string;
  color?: string;
}

export async function listCategories(): Promise<CategoryWithCount[]> {
  const [catRes, prodRes] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase.from('products').select('category_id'),
  ]);
  if (catRes.error) throw new Error(catRes.error.message);
  if (prodRes.error) throw new Error(prodRes.error.message);

  const counts = new Map<string, number>();
  for (const row of prodRes.data ?? []) {
    if (row.category_id) {
      counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
    }
  }

  return ((catRes.data ?? []) as Category[]).map((cat) => ({
    ...cat,
    productCount: counts.get(cat.id) ?? 0,
  }));
}

export async function createCategory(input: CategoryInput, businessId: string): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ ...input, business_id: businessId })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as Category;
}

export async function updateCategory(id: string, input: CategoryInput): Promise<void> {
  const { error } = await supabase.from('categories').update(input).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

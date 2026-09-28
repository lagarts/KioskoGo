import { supabase } from '../lib/supabase';
import type { Category, Product, UnitType } from '../types';

export interface ProductInput {
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  category_id?: string | null;
  cost: number;
  price: number;
  stock: number;
  min_stock: number;
  unit: UnitType;
  tax: number;
}

export interface ProductWithCategory extends Product {
  categories?: Pick<Category, 'id' | 'name' | 'icon' | 'color'> | null;
}

export async function listProducts(): Promise<ProductWithCategory[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(id, name, icon, color)')
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductWithCategory[];
}

export async function createProduct(input: ProductInput, businessId: string): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert({ ...input, business_id: businessId })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as Product;
}

export async function updateProduct(id: string, input: Partial<ProductInput> & { active?: boolean }): Promise<void> {
  const { error } = await supabase.from('products').update(input).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

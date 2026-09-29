import { supabase } from '../lib/supabase';
import type { Category, Product, UnitType } from '../types';
import { resizeImage } from '../utils/image';

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
  image?: string | null;
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

const IMAGE_BUCKET = 'product-images';

export async function uploadProductImage(businessId: string, file: File): Promise<string> {
  const resized = await resizeImage(file);
  const path = `${businessId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, resized, { contentType: 'image/jpeg', upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function removeProductImage(publicUrl: string): Promise<void> {
  const marker = `/object/public/${IMAGE_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return;
  const path = publicUrl.slice(index + marker.length);
  await supabase.storage.from(IMAGE_BUCKET).remove([path]);
}

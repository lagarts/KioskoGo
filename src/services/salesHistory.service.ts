import { supabase } from '../lib/supabase';
import { PAYMENT_LABELS } from './reports.service';

export interface SaleListItem {
  id: string;
  number: number;
  total: number;
  payment_method: string;
  payment_method_label: string;
  status: 'completed' | 'cancelled' | 'refunded';
  created_at: string;
  customer_name: string | null;
  cashier_name: string | null;
  items_count: number;
}

export interface SaleDetailItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface SaleDetail extends SaleListItem {
  items: SaleDetailItem[];
  subtotal: number;
  discount: number;
  register_name: string | null;
  customer_balance: number | null;
}

async function getMethodLabels(businessId: string): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('code, label')
    .eq('business_id', businessId);
  if (error) throw new Error(error.message);
  return new Map<string, string>(
    ((data ?? []) as { code: string; label: string }[]).map((m) => [m.code, m.label])
  );
}

function resolveLabel(map: Map<string, string>, code: string): string {
  return map.get(code) ?? PAYMENT_LABELS[code] ?? code;
}

function dayRange(date: string): { from: string; to: string } {
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { from: start.toISOString(), to: end.toISOString() };
}

export async function listSalesByDate(date: string, businessId: string): Promise<SaleListItem[]> {
  const { from, to } = dayRange(date);
  const { data, error } = await supabase
    .from('sales')
    .select(
      'id, number, total, payment_method, status, created_at, customers(name), profiles:user_id(name), sale_items(count)'
    )
    .gte('created_at', from)
    .lt('created_at', to)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const methodLabels = await getMethodLabels(businessId);

  return ((data ?? []) as unknown as {
    id: string;
    number: number;
    total: string | number;
    payment_method: string;
    status: SaleListItem['status'];
    created_at: string;
    customers: { name: string } | null;
    profiles: { name: string } | null;
    sale_items: { count: number }[];
  }[]).map((row) => ({
    id: row.id,
    number: row.number,
    total: Number(row.total),
    payment_method: row.payment_method,
    payment_method_label: resolveLabel(methodLabels, row.payment_method),
    status: row.status,
    created_at: row.created_at,
    customer_name: row.customers?.name ?? null,
    cashier_name: row.profiles?.name ?? null,
    items_count: row.sale_items?.[0]?.count ?? 0,
  }));
}

export async function getSaleDetail(saleId: string, businessId: string): Promise<SaleDetail> {
  const { data, error } = await supabase
    .from('sales')
    .select(
      'id, number, total, subtotal, discount, payment_method, status, created_at, customers(name, balance), profiles:user_id(name), cash_registers(name), sale_items(quantity, unit_price, total, products(name))'
    )
    .eq('id', saleId)
    .single();
  if (error) throw new Error(error.message);

  const row = data as unknown as {
    id: string;
    number: number;
    total: string | number;
    subtotal: string | number;
    discount: string | number;
    payment_method: string;
    status: SaleListItem['status'];
    created_at: string;
    customers: { name: string; balance: string | number } | null;
    profiles: { name: string } | null;
    cash_registers: { name: string } | null;
    sale_items: {
      quantity: string | number;
      unit_price: string | number;
      total: string | number;
      products: { name: string } | null;
    }[];
  };

  const methodLabels = await getMethodLabels(businessId);

  return {
    id: row.id,
    number: row.number,
    total: Number(row.total),
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    payment_method: row.payment_method,
    payment_method_label: resolveLabel(methodLabels, row.payment_method),
    status: row.status,
    created_at: row.created_at,
    customer_name: row.customers?.name ?? null,
    customer_balance: row.customers ? Number(row.customers.balance) : null,
    cashier_name: row.profiles?.name ?? null,
    register_name: row.cash_registers?.name ?? null,
    items_count: row.sale_items?.length ?? 0,
    items: (row.sale_items ?? []).map((it) => ({
      product_name: it.products?.name ?? 'Producto eliminado',
      quantity: Number(it.quantity),
      unit_price: Number(it.unit_price),
      total: Number(it.total),
    })),
  };
}

export async function cancelSale(saleId: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_sale', { p_sale_id: saleId });
  if (error) throw new Error(error.message);
}

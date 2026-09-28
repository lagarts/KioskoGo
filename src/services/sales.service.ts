import { supabase } from '../lib/supabase';
import type { PaymentMethod } from '../types';

export interface SaleItemInput {
  product_id: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface RecordSaleInput {
  cash_register_id?: string | null;
  customer_id?: string | null;
  payment_method: PaymentMethod;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  items: SaleItemInput[];
}

export interface RecordedSale {
  id: string;
  number: number;
}

export async function recordSale(input: RecordSaleInput): Promise<RecordedSale> {
  const { data, error } = await supabase.rpc('record_sale', {
    p_cash_register_id: input.cash_register_id ?? null,
    p_customer_id: input.customer_id ?? null,
    p_payment_method: input.payment_method,
    p_subtotal: input.subtotal,
    p_discount: input.discount,
    p_tax: input.tax,
    p_total: input.total,
    p_items: input.items,
  });
  if (error) throw new Error(error.message);
  const rows = Array.isArray(data) ? data : [data];
  if (!rows.length || !rows[0]) throw new Error('No se pudo registrar la venta');
  return rows[0] as RecordedSale;
}

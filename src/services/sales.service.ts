import { supabase } from '../lib/supabase';

export interface SaleItemInput {
  product_id: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface RecordSaleInput {
  cash_register_id?: string | null;
  customer_id?: string | null;
  payment_method: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amount_paid?: number;
  items: SaleItemInput[];
}

export interface RecordedSale {
  id: string;
  number: number;
}

export async function recordSale(input: RecordSaleInput): Promise<RecordedSale> {
  const args: Record<string, unknown> = {
    p_cash_register_id: input.cash_register_id ?? null,
    p_customer_id: input.customer_id ?? null,
    p_payment_method: input.payment_method,
    p_subtotal: input.subtotal,
    p_discount: input.discount,
    p_tax: input.tax,
    p_total: input.total,
    p_items: input.items,
  };
  if ((input.amount_paid ?? 0) > 0) {
    args.p_amount_paid = input.amount_paid;
  }
  const { data, error } = await supabase.rpc('record_sale', args);
  if (error) throw new Error(error.message);
  const rows = Array.isArray(data) ? data : [data];
  if (!rows.length || !rows[0]) throw new Error('No se pudo registrar la venta');
  return rows[0] as RecordedSale;
}

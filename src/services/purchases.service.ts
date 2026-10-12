import { supabase } from '../lib/supabase';

export interface PurchaseInput {
  supplierId: string | null;
  notes: string;
  received: boolean;
  items: { product_id: string; quantity: number; unit_cost: number }[];
}

export interface PurchaseListItem {
  id: string;
  number: number;
  total: number;
  status: 'pending' | 'received' | 'cancelled';
  created_at: string;
  notes: string | null;
  supplier_name: string | null;
}

export async function recordPurchase(input: PurchaseInput): Promise<void> {
  const { error } = await supabase.rpc('record_purchase', {
    p_supplier_id: input.supplierId,
    p_notes: input.notes,
    p_received: input.received,
    p_items: input.items,
  });
  if (error) throw new Error(error.message);
}

export async function listPurchases(): Promise<PurchaseListItem[]> {
  const { data, error } = await supabase
    .from('purchases')
    .select('id, number, total, status, created_at, notes, suppliers(name)')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as {
    id: string;
    number: number;
    total: string | number;
    status: PurchaseListItem['status'];
    created_at: string;
    notes: string | null;
    suppliers: { name: string } | null;
  }[]).map((row) => ({
    id: row.id,
    number: row.number,
    total: Number(row.total),
    status: row.status,
    created_at: row.created_at,
    notes: row.notes,
    supplier_name: row.suppliers?.name ?? null,
  }));
}

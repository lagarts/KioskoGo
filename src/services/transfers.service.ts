import { supabase } from '../lib/supabase';

export interface TransferInput {
  productId: string;
  fromBranchId: string;
  toBranchId: string;
  quantity: number;
  notes: string;
}

export interface TransferListItem {
  id: string;
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  product_name: string;
  from_name: string;
  to_name: string;
}

export async function recordTransfer(input: TransferInput): Promise<void> {
  const { error } = await supabase.rpc('record_transfer', {
    p_product_id: input.productId,
    p_from_branch: input.fromBranchId,
    p_to_branch: input.toBranchId,
    p_quantity: input.quantity,
    p_notes: input.notes,
  });
  if (error) throw new Error(error.message);
}

export async function listTransfers(): Promise<TransferListItem[]> {
  const { data, error } = await supabase
    .from('stock_transfers')
    .select(
      'id, quantity, status, notes, created_at, products(name), from_warehouses:from_warehouse_id(name), to_warehouses:to_warehouse_id(name)'
    )
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as {
    id: string;
    quantity: string | number;
    status: TransferListItem['status'];
    notes: string | null;
    created_at: string;
    products: { name: string } | null;
    from_warehouses: { name: string } | null;
    to_warehouses: { name: string } | null;
  }[]).map((row) => ({
    id: row.id,
    quantity: Number(row.quantity),
    status: row.status,
    notes: row.notes,
    created_at: row.created_at,
    product_name: row.products?.name ?? 'Producto eliminado',
    from_name: row.from_warehouses?.name ?? '—',
    to_name: row.to_warehouses?.name ?? '—',
  }));
}

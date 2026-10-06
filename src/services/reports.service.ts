import { supabase } from '../lib/supabase';
import type { PaymentMethod } from '../types';

export type ReportKey = 'caja' | 'mes' | 'anio' | 'cajero' | 'ranking' | 'sucursales';

export interface ReportRow {
  key: string;
  label: string;
  sublabel?: string;
  count: number;
  total: number;
}

export interface ReportResult {
  title: string;
  grandCount: number;
  grandTotal: number;
  rows: ReportRow[];
}

interface SaleRow {
  id: string;
  number: number;
  total: string | number;
  created_at: string;
  user_id: string;
  cash_register_id: string | null;
  branch_id: string | null;
  profiles?: { name: string } | null;
  branches?: { name: string } | null;
  cash_registers?: { name: string } | null;
}

interface ItemRow {
  quantity: string | number;
  total: string | number;
  products?: { name: string } | null;
}

const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  debit: 'Tarjeta Débito',
  credit: 'Tarjeta Crédito',
  transfer: 'Transferencia',
  mercadopago: 'Mercado Pago',
  account: 'Cuenta Corriente',
  other: 'Otro',
};

export interface SaleDetail {
  id: string;
  number: number;
  total: number;
  created_at: string;
  payment_method: PaymentMethod;
  customer_name: string | null;
  customer_balance: number | null;
}

export async function getMonthSales(monthKey: string): Promise<SaleDetail[]> {
  const [year, month] = monthKey.split('-').map(Number);
  const from = new Date(year, month - 1, 1).toISOString();
  const to = new Date(year, month, 1).toISOString();

  const { data, error } = await supabase
    .from('sales')
    .select('id, number, total, created_at, payment_method, customers(name, balance)')
    .eq('status', 'completed')
    .gte('created_at', from)
    .lt('created_at', to)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as {
    id: string;
    number: number;
    total: string | number;
    created_at: string;
    payment_method: PaymentMethod;
    customers: { name: string; balance: string | number } | null;
  }[]).map((row) => ({
    id: row.id,
    number: row.number,
    total: Number(row.total),
    created_at: row.created_at,
    payment_method: row.payment_method,
    customer_name: row.customers?.name ?? null,
    customer_balance: row.customers ? Number(row.customers.balance) : null,
  }));
}

const REPORT_TITLES: Record<ReportKey, string> = {
  caja: 'Historial por caja',
  mes: 'Historial por mes',
  anio: 'Historial por año',
  cajero: 'Historial por cajero',
  ranking: 'Ranking de productos',
  sucursales: 'Ventas por sucursal',
};

interface GroupSpec {
  key: string;
  label: string;
  sublabel?: string;
}

async function fetchSales(): Promise<SaleRow[]> {
  const { data, error } = await supabase
    .from('sales')
    .select(
      'id, number, total, created_at, user_id, cash_register_id, branch_id, profiles(name), branches(name), cash_registers(name)'
    )
    .eq('status', 'completed')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SaleRow[];
}

function aggregate(rows: SaleRow[], groupOf: (row: SaleRow) => GroupSpec): ReportRow[] {
  const map = new Map<string, ReportRow>();
  for (const row of rows) {
    const group = groupOf(row);
    const entry = map.get(group.key) ?? {
      key: group.key,
      label: group.label,
      sublabel: group.sublabel,
      count: 0,
      total: 0,
    };
    entry.count += 1;
    entry.total += Number(row.total);
    map.set(group.key, entry);
  }
  return [...map.values()];
}

export async function getReport(key: ReportKey, businessId: string): Promise<ReportResult> {
  const title = REPORT_TITLES[key];

  if (key === 'ranking') {
    const { data, error } = await supabase
      .from('sale_items')
      .select('quantity, total, products(name), sales!inner(business_id)')
      .eq('sales.business_id', businessId);
    if (error) throw new Error(error.message);

    const map = new Map<string, ReportRow>();
    for (const item of (data ?? []) as unknown as ItemRow[]) {
      const name = item.products?.name ?? 'Producto eliminado';
      const entry = map.get(name) ?? { key: name, label: name, count: 0, total: 0 };
      entry.count += Number(item.quantity);
      entry.total += Number(item.total);
      map.set(name, entry);
    }
    const rows = [...map.values()].sort((a, b) => b.count - a.count).slice(0, 20);    return {
      title,
      grandCount: rows.reduce((sum, r) => sum + r.count, 0),
      grandTotal: rows.reduce((sum, r) => sum + r.total, 0),
      rows,
    };
  }

  const sales = await fetchSales();
  let rows: ReportRow[];

  switch (key) {
    case 'caja':
      rows = aggregate(sales, (row) => ({
        key: row.cash_register_id ?? 'sin-caja',
        label: row.cash_registers?.name ?? 'Caja sin nombre',
        sublabel: row.branches?.name ?? undefined,
      })).sort((a, b) => b.total - a.total);
      break;
    case 'mes':
      rows = aggregate(sales, (row) => {
        const d = new Date(row.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return { key, label: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}` };
      }).sort((a, b) => b.key.localeCompare(a.key));
      break;
    case 'anio':
      rows = aggregate(sales, (row) => {
        const key = String(new Date(row.created_at).getFullYear());
        return { key, label: key };
      }).sort((a, b) => b.key.localeCompare(a.key));
      break;
    case 'cajero':
      rows = aggregate(sales, (row) => ({
        key: row.user_id,
        label: row.profiles?.name ?? 'Usuario',
      })).sort((a, b) => b.total - a.total);
      break;
    case 'sucursales':
      rows = aggregate(sales, (row) => ({
        key: row.branch_id ?? 'sin-sucursal',
        label: row.branches?.name ?? 'Sin sucursal',
      })).sort((a, b) => b.total - a.total);
      break;
    default:
      rows = [];
  }

  return {
    title,
    grandCount: sales.length,
    grandTotal: sales.reduce((sum, row) => sum + Number(row.total), 0),
    rows,
  };
}

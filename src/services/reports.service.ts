import { supabase } from '../lib/supabase';

export interface DayAmount {
  day: string;
  amount: number;
}

export interface PaymentBreakdown {
  method: string;
  amount: number;
  percentage: number;
}

export interface ReportsData {
  monthSalesTotal: number;
  monthExpensesTotal: number;
  itemsSold: number;
  avgTicket: number;
  salesByDay: DayAmount[];
  salesByPayment: PaymentBreakdown[];
  topProducts: { name: string; sold: number; revenue: number }[];
  stockStatus: { normal: number; low: number; out: number };
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  debit: 'Tarjeta Débito',
  credit: 'Tarjeta Crédito',
  transfer: 'Transferencia',
  mercadopago: 'Mercado Pago',
  account: 'Cuenta Corriente',
  other: 'Otro',
};

function startOfMonth(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getReportsData(): Promise<ReportsData> {
  const monthIso = startOfMonth();
  const weekIso = daysAgoIso(6);

  const [monthSalesRes, expensesRes, productsRes, weekSalesRes] = await Promise.all([
    supabase.from('sales').select('id, total, payment_method, created_at').eq('status', 'completed').gte('created_at', monthIso),
    supabase.from('expenses').select('amount').gte('date', monthIso.slice(0, 10)),
    supabase.from('products').select('stock, min_stock'),
    supabase.from('sales').select('total, payment_method, created_at').eq('status', 'completed').gte('created_at', weekIso),
  ]);

  if (monthSalesRes.error) throw new Error(monthSalesRes.error.message);
  if (expensesRes.error) throw new Error(expensesRes.error.message);
  if (productsRes.error) throw new Error(productsRes.error.message);
  if (weekSalesRes.error) throw new Error(weekSalesRes.error.message);

  const monthSales = monthSalesRes.data ?? [];
  const monthSalesTotal = monthSales.reduce((sum, row) => sum + Number(row.total), 0);
  const monthExpensesTotal = (expensesRes.data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
  const avgTicket = monthSales.length > 0 ? monthSalesTotal / monthSales.length : 0;

  const salesByDay: DayAmount[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const dayIso = new Date(day);
    dayIso.setHours(0, 0, 0, 0);
    const next = new Date(dayIso);
    next.setDate(next.getDate() + 1);
    const amount = (weekSalesRes.data ?? [])
      .filter((row) => {
        const created = new Date(row.created_at);
        return created >= dayIso && created < next;
      })
      .reduce((sum, row) => sum + Number(row.total), 0);
    salesByDay.push({ day: DAY_LABELS[day.getDay()], amount });
  }

  const byMethod = new Map<string, number>();
  for (const row of monthSales) {
    byMethod.set(row.payment_method, (byMethod.get(row.payment_method) ?? 0) + Number(row.total));
  }
  const salesByPayment: PaymentBreakdown[] = [...byMethod.entries()]
    .map(([method, amount]) => ({
      method: PAYMENT_LABELS[method] ?? method,
      amount,
      percentage: monthSalesTotal > 0 ? Math.round((amount / monthSalesTotal) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const monthIds = monthSales.map((row) => row.id as string);
  const topMap = new Map<string, { name: string; sold: number; revenue: number }>();
  if (monthIds.length > 0) {
    const itemsRes = await supabase
      .from('sale_items')
      .select('quantity, total, products(name)')
      .in('sale_id', monthIds);
    if (itemsRes.error) throw new Error(itemsRes.error.message);
    for (const item of itemsRes.data ?? []) {
      const product = item.products as unknown as { name: string } | null;
      if (!product) continue;
      const entry = topMap.get(product.name) ?? { name: product.name, sold: 0, revenue: 0 };
      entry.sold += Number(item.quantity);
      entry.revenue += Number(item.total);
      topMap.set(product.name, entry);
    }
  }

  const products = productsRes.data ?? [];
  const stockStatus = {
    normal: products.filter((p) => Number(p.stock) > Number(p.min_stock)).length,
    low: products.filter((p) => Number(p.stock) <= Number(p.min_stock) && Number(p.stock) > 0).length,
    out: products.filter((p) => Number(p.stock) <= 0).length,
  };

  const itemsSold = [...topMap.values()].reduce((sum, p) => sum + p.sold, 0);

  return {
    monthSalesTotal,
    monthExpensesTotal,
    itemsSold,
    avgTicket,
    salesByDay,
    salesByPayment,
    topProducts: [...topMap.values()].sort((a, b) => b.sold - a.sold).slice(0, 5),
    stockStatus,
  };
}

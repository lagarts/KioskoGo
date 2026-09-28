import { supabase } from '../lib/supabase';

export interface RecentSale {
  id: string;
  number: number;
  total: number;
  payment_method: string;
  created_at: string;
  customers: { name: string } | null;
}

export interface TopProduct {
  name: string;
  sold: number;
  revenue: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  min_stock: number;
  unit: string;
}

export interface DashboardData {
  todayTotal: number;
  monthTotal: number;
  productCount: number;
  lowStockCount: number;
  recentSales: RecentSale[];
  topProducts: TopProduct[];
  lowStockProducts: LowStockProduct[];
}

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonth(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getDashboardData(): Promise<DashboardData> {
  const todayIso = startOfToday();
  const monthIso = startOfMonth();

  const [todayRes, monthRes, productsRes, recentRes] = await Promise.all([
    supabase.from('sales').select('total').eq('status', 'completed').gte('created_at', todayIso),
    supabase.from('sales').select('id, total').eq('status', 'completed').gte('created_at', monthIso),
    supabase.from('products').select('id, name, stock, min_stock, unit'),
    supabase
      .from('sales')
      .select('id, number, total, payment_method, created_at, customers(name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  if (todayRes.error) throw new Error(todayRes.error.message);
  if (monthRes.error) throw new Error(monthRes.error.message);
  if (productsRes.error) throw new Error(productsRes.error.message);
  if (recentRes.error) throw new Error(recentRes.error.message);

  const todayTotal = (todayRes.data ?? []).reduce((sum, row) => sum + Number(row.total), 0);
  const monthTotal = (monthRes.data ?? []).reduce((sum, row) => sum + Number(row.total), 0);
  const products = productsRes.data ?? [];
  const lowStockProducts: LowStockProduct[] = products
    .filter((p) => Number(p.stock) <= Number(p.min_stock))
    .map((p) => ({
      id: p.id as string,
      name: p.name as string,
      stock: Number(p.stock),
      min_stock: Number(p.min_stock),
      unit: p.unit as string,
    }));

  const monthIds = (monthRes.data ?? []).map((row) => row.id as string);
  let topProducts: TopProduct[] = [];
  if (monthIds.length > 0) {
    const itemsRes = await supabase
      .from('sale_items')
      .select('quantity, total, products(name)')
      .in('sale_id', monthIds);
    if (itemsRes.error) throw new Error(itemsRes.error.message);

    const agg = new Map<string, TopProduct>();
    for (const item of itemsRes.data ?? []) {
      const product = item.products as unknown as { name: string } | null;
      if (!product) continue;
      const entry = agg.get(product.name) ?? { name: product.name, sold: 0, revenue: 0 };
      entry.sold += Number(item.quantity);
      entry.revenue += Number(item.total);
      agg.set(product.name, entry);
    }
    topProducts = [...agg.values()].sort((a, b) => b.sold - a.sold).slice(0, 5);
  }

  return {
    todayTotal,
    monthTotal,
    productCount: products.length,
    lowStockCount: lowStockProducts.length,
    recentSales: (recentRes.data ?? []) as unknown as RecentSale[],
    topProducts,
    lowStockProducts: lowStockProducts.slice(0, 6),
  };
}

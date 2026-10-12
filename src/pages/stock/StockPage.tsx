import { useCallback, useEffect, useMemo, useState } from 'react';
import { Warehouse as WarehouseIcon, Search, Boxes } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { listProducts } from '../../services/products.service';
import { listBranches } from '../../services/branches.service';
import { listCategories, type CategoryWithCount } from '../../services/categories.service';
import { canSeeFinancials } from '../../lib/roles';
import { formatCurrency } from '../../utils/format';
import type { Product, Branch } from '../../types';

interface BranchStockMap {
  [productId: string]: { [branchId: string]: number };
}

export function StockPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchStock, setBranchStock] = useState<BranchStockMap>({});
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');

  const showCosts = !!user && canSeeFinancials(user.role);

  const load = useCallback(async () => {
    try {
      const [prods, brs, cats] = await Promise.all([
        listProducts(),
        listBranches(),
        listCategories(),
      ]);
      setProducts(prods.filter((p) => p.active));
      setBranches(brs.filter((b) => b.active));
      setCategories(cats);

      const { data: pbData, error: pbError } = await supabase
        .from('product_branches')
        .select('product_id, branch_id, stock');
      if (pbError) throw new Error(pbError.message);

      const map: BranchStockMap = {};
      for (const row of (pbData ?? []) as { product_id: string; branch_id: string; stock: string | number }[]) {
        if (!map[row.product_id]) map[row.product_id] = {};
        map[row.product_id][row.branch_id] = Number(row.stock);
      }
      setBranchStock(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando el stock');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalUnits = products.reduce((sum, p) => sum + Number(p.stock), 0);
  const totalValue = products.reduce((sum, p) => sum + Number(p.stock) * Number(p.cost), 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.barcode ?? '').toLowerCase().includes(q) ||
        (p.sku ?? '').toLowerCase().includes(q);
      const matchCategory = categoryId === 'all' || p.category_id === categoryId;
      return matchSearch && matchCategory;
    });
  }, [products, search, categoryId]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-kiosko-600/15 flex items-center justify-center">
          <WarehouseIcon size={20} className="text-kiosko-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Stock</h1>
          <p className="text-sm text-surface-400">Stock por sucursal</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-400">Productos</p>
            <Boxes size={18} className="text-kiosko-500" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">{products.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-surface-400">Unidades en stock</p>
          <p className="text-2xl font-bold text-white mt-1">
            {totalUnits.toLocaleString('es-AR')}
          </p>
        </Card>
        {showCosts && (
          <Card>
            <p className="text-sm text-surface-400">Valor de inventario</p>
            <p className="text-2xl font-bold text-kiosko-500 mt-1">
              {formatCurrency(totalValue)}
            </p>
          </Card>
        )}
      </div>

      <Card padding={false}>
        <div className="flex flex-col md:flex-row md:items-center gap-3 p-4 border-b border-surface-800">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, código o SKU..."
              className="w-full bg-surface-800 border border-surface-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-kiosko-500/50"
            />
          </div>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="bg-surface-800 border border-surface-700 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-kiosko-500/50"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-surface-400 text-center py-10">Cargando stock...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-surface-500 text-center py-10">No hay productos para mostrar</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Producto</th>
                  {branches.map((br) => (
                    <th key={br.id} className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase">
                      {br.name}
                    </th>
                  ))}
                  <th className="text-right px-4 py-3 text-xs font-semibold text-kiosko-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const bStock = branchStock[p.id] ?? {};
                  return (
                    <tr key={p.id} className="border-b border-surface-800/50 hover:bg-surface-800/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img src={p.image} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-surface-800 border border-surface-700 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-white truncate">{p.name}</p>
                            {p.barcode && <p className="text-xs text-surface-500 font-mono">{p.barcode}</p>}
                          </div>
                        </div>
                      </td>
                      {branches.map((br) => (
                        <td key={br.id} className="px-4 py-3 text-right text-surface-300">
                          {bStock[br.id] ?? 0}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right font-semibold text-kiosko-500">
                        {Number(p.stock)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Warehouse as WarehouseIcon, Search, AlertTriangle, Boxes, Building2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { listProducts } from '../../services/products.service';
import { listWarehouses } from '../../services/warehouses.service';
import { listCategories, type CategoryWithCount } from '../../services/categories.service';
import { canSeeFinancials } from '../../lib/roles';
import { formatCurrency } from '../../utils/format';
import type { Product, Warehouse } from '../../types';

export function StockPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [onlyLow, setOnlyLow] = useState(false);

  const showCosts = !!user && canSeeFinancials(user.role);

  const load = useCallback(async () => {
    try {
      const [prods, whs, cats] = await Promise.all([
        listProducts(),
        listWarehouses(),
        listCategories(),
      ]);
      setProducts(prods.filter((p) => p.active));
      setWarehouses(whs);
      setCategories(cats);
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
  const lowCount = products.filter((p) => Number(p.stock) <= Number(p.min_stock)).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.barcode ?? '').toLowerCase().includes(q) ||
        (p.sku ?? '').toLowerCase().includes(q);
      const matchCategory = categoryId === 'all' || p.category_id === categoryId;
      const matchLow = !onlyLow || Number(p.stock) <= Number(p.min_stock);
      return matchSearch && matchCategory && matchLow;
    });
  }, [products, search, categoryId, onlyLow]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-kiosko-600/15 flex items-center justify-center">
          <WarehouseIcon size={20} className="text-kiosko-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Stock</h1>
          <p className="text-sm text-surface-400">Productos, depósitos y totales del inventario</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-400">Depósitos</p>
            <Building2 size={18} className="text-surface-500" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">{warehouses.length}</p>
        </Card>
      </div>

      {warehouses.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-white mb-3">Depósitos</h2>
          <div className="flex flex-wrap gap-2">
            {warehouses.map((wh) => (
              <span
                key={wh.id}
                className="inline-flex items-center gap-2 bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-200"
              >
                <Building2 size={14} className="text-kiosko-500" />
                {wh.name}
                {wh.is_default && (
                  <span className="text-[10px] uppercase tracking-wide text-kiosko-500 border border-kiosko-600/40 rounded px-1.5 py-0.5">
                    Principal
                  </span>
                )}
                {wh.address && <span className="text-xs text-surface-500">— {wh.address}</span>}
              </span>
            ))}
          </div>
        </Card>
      )}

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
          <label className="flex items-center gap-2 text-sm text-surface-300 cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={onlyLow}
              onChange={(e) => setOnlyLow(e.target.checked)}
              className="accent-kiosko-500 w-4 h-4"
            />
            Solo stock bajo ({lowCount})
          </label>
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase hidden md:table-cell">Categoría</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Stock</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase hidden sm:table-cell">Mínimo</th>
                  {showCosts && (
                    <>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase hidden md:table-cell">Costo</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Valor</th>
                    </>
                  )}
                  <th className="text-center px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const low = Number(p.stock) <= Number(p.min_stock);
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
                      <td className="px-4 py-3 text-surface-300 hidden md:table-cell">
                        {categories.find((c) => c.id === p.category_id)?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${low ? 'text-red-400' : 'text-white'}`}>
                          {Number(p.stock)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-surface-400 hidden sm:table-cell">
                        {Number(p.min_stock)}
                      </td>
                      {showCosts && (
                        <>
                          <td className="px-4 py-3 text-right text-surface-300 hidden md:table-cell">
                            {formatCurrency(Number(p.cost))}
                          </td>
                          <td className="px-4 py-3 text-right text-surface-300">
                            {formatCurrency(Number(p.stock) * Number(p.cost))}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3 text-center">
                        {low ? (
                          <span className="inline-flex items-center gap-1 text-xs text-yellow-400 border border-yellow-800 bg-yellow-900/20 rounded px-2 py-1">
                            <AlertTriangle size={11} />
                            Stock bajo
                          </span>
                        ) : (
                          <Badge variant="success">OK</Badge>
                        )}
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

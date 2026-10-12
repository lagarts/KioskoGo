import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShoppingCart, Plus, Trash2, X, PackageCheck, Search } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { listSuppliers } from '../../services/suppliers.service';
import { listProducts } from '../../services/products.service';
import {
  recordPurchase,
  listPurchases,
  type PurchaseListItem,
} from '../../services/purchases.service';
import type { Supplier, Product } from '../../types';
import { formatCurrency, formatDate, formatTime } from '../../utils/format';

interface PurchaseRow {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
}

export function PurchasesPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<PurchaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [received, setReceived] = useState(true);
  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [pickedProductId, setPickedProductId] = useState('');

  const load = useCallback(async () => {
    try {
      const [sup, prods, purs] = await Promise.all([
        listSuppliers(),
        listProducts(),
        listPurchases(),
      ]);
      setSuppliers(sup);
      setProducts(prods);
      setPurchases(purs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    const list = q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.barcode ?? '').toLowerCase().includes(q)
        )
      : products;
    return list.slice(0, 60);
  }, [products, productSearch]);

  const total = rows.reduce((sum, r) => sum + r.quantity * r.unitCost, 0);

  const addProduct = () => {
    const product = products.find((p) => p.id === pickedProductId);
    if (!product) return;
    setRows((prev) => {
      const existing = prev.find((r) => r.productId === product.id);
      if (existing) {
        return prev.map((r) =>
          r.productId === product.id ? { ...r, quantity: r.quantity + 1 } : r
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitCost: Number(product.cost) || 0,
        },
      ];
    });
    setPickedProductId('');
    setProductSearch('');
  };

  const updateRow = (productId: string, patch: Partial<PurchaseRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.productId === productId ? { ...r, ...patch } : r))
    );
  };

  const removeRow = (productId: string) => {
    setRows((prev) => prev.filter((r) => r.productId !== productId));
  };

  const resetForm = () => {
    setSupplierId('');
    setNotes('');
    setReceived(true);
    setRows([]);
    setProductSearch('');
    setPickedProductId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (rows.length === 0) {
      setError('Agregá al menos un producto a la compra');
      return;
    }
    const invalid = rows.some((r) => r.quantity <= 0 || r.unitCost < 0);
    if (invalid) {
      setError('Revisá cantidades y costos: deben ser mayores a cero');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await recordPurchase({
        supplierId: supplierId || null,
        notes,
        received,
        items: rows.map((r) => ({
          product_id: r.productId,
          quantity: r.quantity,
          unit_cost: r.unitCost,
        })),
      });
      setMessage(
        received
          ? 'Compra registrada. El stock y los costos se actualizaron.'
          : 'Compra registrada como pendiente de recepción.'
      );
      resetForm();
      setShowForm(false);
      setPurchases(await listPurchases());
      setProducts(await listProducts());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la compra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-kiosko-600/15 flex items-center justify-center">
            <ShoppingCart size={20} className="text-kiosko-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Compras</h1>
            <p className="text-sm text-surface-400">Registra y gestiona compras a proveedores</p>
          </div>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setError('');
            setShowForm(true);
          }}
        >
          <Plus size={16} />
          Nueva compra
        </Button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {message && (
        <div className="bg-green-900/30 border border-green-800 text-green-400 text-sm px-4 py-3 rounded-lg">
          {message}
        </div>
      )}

      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Cargar compra</h2>
            <button onClick={() => setShowForm(false)} className="text-surface-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Proveedor</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-kiosko-500/50"
                >
                  <option value="">Sin proveedor</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.company ? ` — ${s.company}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Notas (opcional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nº de factura, observaciones..."
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">
                Agregar producto
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
                  <input
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setPickedProductId('');
                    }}
                    placeholder="Buscar producto por nombre o código..."
                    className="w-full bg-surface-800 border border-surface-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-kiosko-500/50"
                  />
                  {productSearch && !pickedProductId && (
                    <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-surface-800 border border-surface-700 rounded-lg max-h-56 overflow-y-auto shadow-xl">
                      {filteredProducts.length === 0 ? (
                        <p className="text-xs text-surface-500 px-3 py-2">Sin resultados</p>
                      ) : (
                        filteredProducts.map((p) => (
                          <button
                            type="button"
                            key={p.id}
                            onClick={() => {
                              setPickedProductId(p.id);
                              setProductSearch(p.name);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-surface-200 hover:bg-surface-700 flex justify-between gap-3"
                          >
                            <span className="truncate">{p.name}</span>
                            <span className="text-surface-500 shrink-0">
                              costo {formatCurrency(Number(p.cost))}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <Button type="button" onClick={addProduct} disabled={!pickedProductId}>
                  <Plus size={16} />
                  Agregar
                </Button>
              </div>
            </div>

            {rows.length > 0 && (
              <div className="border border-surface-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-800/60 border-b border-surface-700">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-surface-400 uppercase">Producto</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-surface-400 uppercase w-28">Cantidad</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-surface-400 uppercase w-36">Costo unit.</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-surface-400 uppercase w-32">Subtotal</th>
                      <th className="w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.productId} className="border-b border-surface-800/50 last:border-0">
                        <td className="px-3 py-2 text-white">{r.productName}</td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0.01}
                            step="0.01"
                            value={r.quantity}
                            onChange={(e) =>
                              updateRow(r.productId, { quantity: parseFloat(e.target.value) || 0 })
                            }
                            className="w-20 bg-surface-800 border border-surface-700 rounded-lg px-2 py-1 text-sm text-white text-right focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={r.unitCost}
                            onChange={(e) =>
                              updateRow(r.productId, { unitCost: parseFloat(e.target.value) || 0 })
                            }
                            className="w-24 bg-surface-800 border border-surface-700 rounded-lg px-2 py-1 text-sm text-white text-right focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-kiosko-500">
                          {formatCurrency(r.quantity * r.unitCost)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeRow(r.productId)}
                            className="p-1.5 rounded-lg text-surface-400 hover:text-red-400 hover:bg-red-900/20"
                            title="Quitar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-sm text-surface-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={received}
                  onChange={(e) => setReceived(e.target.checked)}
                  className="accent-kiosko-500 w-4 h-4"
                />
                Mercadería recibida (suma stock y actualiza el costo)
              </label>
              <p className="text-lg font-bold text-white">
                Total:{' '}
                <span className="text-kiosko-500">{formatCurrency(total)}</span>
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="secondary" fullWidth onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" fullWidth disabled={saving || rows.length === 0}>
                <PackageCheck size={16} />
                {saving ? 'Guardando...' : 'Registrar compra'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card padding={false}>
        <div className="px-4 py-3 border-b border-surface-800">
          <h2 className="text-sm font-semibold text-white">Últimas compras</h2>
        </div>
        {loading ? (
          <p className="text-sm text-surface-400 text-center py-10">Cargando...</p>
        ) : purchases.length === 0 ? (
          <p className="text-sm text-surface-500 text-center py-10">
            Todavía no cargaste compras
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Compra</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Proveedor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase hidden md:table-cell">Notas</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id} className="border-b border-surface-800/50 hover:bg-surface-800/30">
                    <td className="px-4 py-3 font-medium text-white">#{p.number}</td>
                    <td className="px-4 py-3 text-surface-300">
                      {formatDate(p.created_at)} {formatTime(p.created_at)}
                    </td>
                    <td className="px-4 py-3 text-surface-300">{p.supplier_name ?? '—'}</td>
                    <td className="px-4 py-3 text-surface-400 hidden md:table-cell max-w-[240px] truncate">
                      {p.notes ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-kiosko-500">
                      {formatCurrency(p.total)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.status === 'received' ? (
                        <Badge variant="success">Recibida</Badge>
                      ) : p.status === 'pending' ? (
                        <Badge variant="warning">Pendiente</Badge>
                      ) : (
                        <Badge variant="danger">Anulada</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, ArrowRight, Search, History, Building2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { listProducts } from '../../services/products.service';
import { listBranches } from '../../services/branches.service';
import {
  recordTransfer,
  listTransfers,
  type TransferListItem,
} from '../../services/transfers.service';
import type { Product, Branch } from '../../types';
import { formatDate, formatTime } from '../../utils/format';

export function TransfersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [transfers, setTransfers] = useState<TransferListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [pickedProductId, setPickedProductId] = useState('');
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    try {
      const [prods, brs, trs] = await Promise.all([
        listProducts(),
        listBranches(),
        listTransfers(),
      ]);
      setProducts(prods.filter((p) => p.active));
      setBranches(brs.filter((b) => b.active));
      setTransfers(trs);
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

  const pickedProduct = products.find((p) => p.id === pickedProductId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!pickedProductId || !fromId || !toId) {
      setError('Elegí el producto y ambas sucursales');
      return;
    }
    if (fromId === toId) {
      setError('Las sucursales deben ser distintas');
      return;
    }
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      setError('Ingresá una cantidad mayor a cero');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await recordTransfer({
        productId: pickedProductId,
        fromBranchId: fromId,
        toBranchId: toId,
        quantity: qty,
        notes,
      });
      setMessage('Transferencia registrada.');
      setProductSearch('');
      setPickedProductId('');
      setQuantity('1');
      setNotes('');
      setTransfers(await listTransfers());
      setProducts((await listProducts()).filter((p) => p.active));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la transferencia');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-kiosko-600/15 flex items-center justify-center">
          <ArrowLeftRight size={20} className="text-kiosko-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Transferencias</h1>
          <p className="text-sm text-surface-400">Transfiere productos entre sucursales</p>
        </div>
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

      {branches.length < 2 ? (
        <Card>
          <div className="text-center py-8 space-y-2">
            <Building2 size={32} className="text-surface-600 mx-auto" />
            <p className="text-sm text-surface-400">
              Necesitás al menos dos sucursales activas para hacer transferencias.
            </p>
            <p className="text-xs text-surface-500">
              Crealas desde <span className="text-surface-300">Configuración → Sucursales</span>.
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <h2 className="text-lg font-bold text-white mb-4">Nueva transferencia</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Producto</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
                <input
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setPickedProductId('');
                  }}
                  placeholder="Buscar por nombre o código..."
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
                          <span className="text-surface-500 shrink-0">stock {Number(p.stock)}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {pickedProduct && (
                <p className="text-xs text-surface-500 mt-1.5">
                  Stock actual del producto: <span className="text-white">{Number(pickedProduct.stock)}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Desde</label>
                <select
                  value={fromId}
                  onChange={(e) => setFromId(e.target.value)}
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-kiosko-500/50"
                >
                  <option value="">Elegir sucursal...</option>
                  {branches.map((br) => (
                    <option key={br.id} value={br.id} disabled={br.id === toId}>
                      {br.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hidden md:flex pb-2.5 justify-center">
                <ArrowRight size={20} className="text-kiosko-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Hacia</label>
                <select
                  value={toId}
                  onChange={(e) => setToId(e.target.value)}
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-kiosko-500/50"
                >
                  <option value="">Elegir sucursal...</option>
                  {branches.map((br) => (
                    <option key={br.id} value={br.id} disabled={br.id === fromId}>
                      {br.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Cantidad"
                type="number"
                min={0.01}
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <Input
                label="Notas (opcional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Motivo, remito..."
                maxLength={200}
              />
            </div>

            <p className="text-xs text-surface-500">
              La transferencia registra el movimiento entre sucursales. El stock total del producto
              no cambia.
            </p>

            <Button type="submit" size="lg" disabled={saving}>
              <ArrowLeftRight size={16} />
              {saving ? 'Registrando...' : 'Transferir'}
            </Button>
          </form>
        </Card>
      )}

      <Card padding={false}>
        <div className="px-4 py-3 border-b border-surface-800 flex items-center gap-2">
          <History size={15} className="text-kiosko-500" />
          <h2 className="text-sm font-semibold text-white">Últimas transferencias</h2>
        </div>
        {loading ? (
          <p className="text-sm text-surface-400 text-center py-10">Cargando...</p>
        ) : transfers.length === 0 ? (
          <p className="text-sm text-surface-500 text-center py-10">Todavía no hay transferencias</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Producto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Desde</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Hacia</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Cantidad</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase hidden md:table-cell">Notas</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t.id} className="border-b border-surface-800/50 hover:bg-surface-800/30">
                    <td className="px-4 py-3 text-surface-300">
                      {formatDate(t.created_at)} {formatTime(t.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{t.product_name}</td>
                    <td className="px-4 py-3 text-surface-300">{t.from_name}</td>
                    <td className="px-4 py-3 text-surface-300">{t.to_name}</td>
                    <td className="px-4 py-3 text-right font-semibold text-kiosko-500">{t.quantity}</td>
                    <td className="px-4 py-3 text-surface-400 hidden md:table-cell max-w-[200px] truncate">
                      {t.notes ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.status === 'completed' ? (
                        <Badge variant="success">Completada</Badge>
                      ) : t.status === 'pending' ? (
                        <Badge variant="warning">Pendiente</Badge>
                      ) : (
                        <Badge variant="danger">Cancelada</Badge>
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

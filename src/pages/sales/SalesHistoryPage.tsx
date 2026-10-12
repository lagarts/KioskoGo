import { useCallback, useEffect, useState } from 'react';
import {
  Receipt,
  Eye,
  Ban,
  X,
  CalendarDays,
  PackageX,
  User,
  CreditCard,
  Clock,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import {
  listSalesByDate,
  getSaleDetail,
  cancelSale,
  type SaleListItem,
  type SaleDetail,
} from '../../services/salesHistory.service';
import { formatCurrency, formatDateTime } from '../../utils/format';

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function shiftDay(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function SalesHistoryPage() {
  const { user } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [sales, setSales] = useState<SaleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<SaleDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!user?.business_id) return;
    setLoading(true);
    setError('');
    try {
      setSales(await listSalesByDate(date, user.business_id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando ventas');
    } finally {
      setLoading(false);
    }
  }, [date, user?.business_id]);

  useEffect(() => {
    void load();
  }, [load]);

  const completed = sales.filter((s) => s.status === 'completed');
  const cancelled = sales.filter((s) => s.status === 'cancelled');
  const totalSold = completed.reduce((sum, s) => sum + s.total, 0);
  const totalCash = completed
    .filter((s) => s.payment_method === 'cash')
    .reduce((sum, s) => sum + s.total, 0);

  const openDetail = async (sale: SaleListItem) => {
    if (!user?.business_id) return;
    setDetailLoading(true);
    setDetail(null);
    try {
      setDetail(await getSaleDetail(sale.id, user.business_id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error cargando el detalle');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCancel = async (sale: SaleListItem) => {
    if (cancelling) return;
    const ok = confirm(
      `¿Anular la venta #${sale.number} de ${formatCurrency(sale.total)}?\n\nSe devuelve el stock y, si fue a cuenta corriente, se ajusta el saldo del cliente.`
    );
    if (!ok) return;
    setCancelling(true);
    try {
      await cancelSale(sale.id);
      setDetail(null);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo anular la venta');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-kiosko-600/15 flex items-center justify-center">
            <Receipt size={20} className="text-kiosko-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Historial de Ventas</h1>
            <p className="text-sm text-surface-400">
              Ventas del día: mirá el detalle o anulá si algo salió mal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant={date === todayISO() ? 'primary' : 'secondary'} onClick={() => setDate(todayISO())}>
            Hoy
          </Button>
          <Button size="sm" variant={date === shiftDay(todayISO(), -1) ? 'primary' : 'secondary'} onClick={() => setDate(shiftDay(todayISO(), -1))}>
            Ayer
          </Button>
          <div className="relative">
            <CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || todayISO())}
              className="bg-surface-800 border border-surface-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-kiosko-500/50"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-surface-400">Ventas</p>
          <p className="text-2xl font-bold text-white mt-1">{completed.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-surface-400">Total cobrado</p>
          <p className="text-2xl font-bold text-kiosko-500 mt-1">{formatCurrency(totalSold)}</p>
        </Card>
        <Card>
          <p className="text-sm text-surface-400">En efectivo</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(totalCash)}</p>
        </Card>
        <Card>
          <p className="text-sm text-surface-400">Anuladas</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{cancelled.length}</p>
        </Card>
      </div>

      <Card padding={false}>
        {loading ? (
          <p className="text-sm text-surface-400 text-center py-10">Cargando ventas...</p>
        ) : sales.length === 0 ? (
          <div className="text-center py-10">
            <PackageX size={32} className="text-surface-600 mx-auto mb-3" />
            <p className="text-sm text-surface-400">No hay ventas registradas en este día</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Venta</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Hora</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase hidden md:table-cell">Cajero</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase hidden lg:table-cell">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Método</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Ítems</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Estado</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className={`border-b border-surface-800/50 hover:bg-surface-800/30 ${
                      sale.status === 'cancelled' ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-white">#{sale.number}</td>
                    <td className="px-4 py-3 text-surface-300">{formatTime(sale.created_at)}</td>
                    <td className="px-4 py-3 text-surface-300 hidden md:table-cell">{sale.cashier_name ?? '—'}</td>
                    <td className="px-4 py-3 text-surface-300 hidden lg:table-cell">{sale.customer_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={sale.payment_method === 'account' ? 'warning' : 'info'}>
                        {sale.payment_method_label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-surface-300">{sale.items_count}</td>
                    <td className="px-4 py-3 text-right font-semibold text-kiosko-500">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {sale.status === 'completed' ? (
                        <Badge variant="success">Completada</Badge>
                      ) : (
                        <Badge variant="danger">Anulada</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => void openDetail(sale)}
                          className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white"
                          title="Ver detalle"
                        >
                          <Eye size={15} />
                        </button>
                        {sale.status === 'completed' && (
                          <button
                            onClick={() => void handleCancel(sale)}
                            disabled={cancelling}
                            className="p-1.5 rounded-lg hover:bg-red-900/30 text-surface-400 hover:text-red-400 disabled:opacity-50"
                            title="Anular venta"
                          >
                            <Ban size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => !detailLoading && setDetail(null)} />
          <div className="relative bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            {detailLoading || !detail ? (
              <p className="text-sm text-surface-400 text-center py-8">Cargando detalle...</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-white">Venta #{detail.number}</h2>
                  <button onClick={() => setDetail(null)} className="text-surface-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-5">
                  <div className="bg-surface-800/60 border border-surface-700 rounded-lg p-3">
                    <p className="text-xs text-surface-400 flex items-center gap-1.5 mb-1">
                      <Clock size={12} /> Fecha y hora
                    </p>
                    <p className="text-white">{formatDateTime(detail.created_at)}</p>
                  </div>
                  <div className="bg-surface-800/60 border border-surface-700 rounded-lg p-3">
                    <p className="text-xs text-surface-400 flex items-center gap-1.5 mb-1">
                      <User size={12} /> Cajero
                    </p>
                    <p className="text-white">{detail.cashier_name ?? '—'}</p>
                  </div>
                  <div className="bg-surface-800/60 border border-surface-700 rounded-lg p-3">
                    <p className="text-xs text-surface-400 flex items-center gap-1.5 mb-1">
                      <CreditCard size={12} /> Método de pago
                    </p>
                    <p className="text-white">{detail.payment_method_label}</p>
                  </div>
                  <div className="bg-surface-800/60 border border-surface-700 rounded-lg p-3">
                    <p className="text-xs text-surface-400 mb-1">Estado / Caja</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {detail.status === 'completed' ? (
                        <Badge variant="success">Completada</Badge>
                      ) : (
                        <Badge variant="danger">Anulada</Badge>
                      )}
                      {detail.register_name && (
                        <span className="text-xs text-surface-400">{detail.register_name}</span>
                      )}
                    </div>
                  </div>
                  {detail.customer_name && (
                    <div className="bg-surface-800/60 border border-surface-700 rounded-lg p-3 col-span-2">
                      <p className="text-xs text-surface-400 mb-1">Cliente</p>
                      <p className="text-white">
                        {detail.customer_name}
                        {detail.customer_balance != null && (
                          <span className="text-xs text-surface-400 ml-2">
                            (saldo actual: {formatCurrency(detail.customer_balance)})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-white mb-2">Productos</h3>
                <div className="space-y-2 mb-4">
                  {detail.items.length === 0 ? (
                    <p className="text-sm text-surface-500">Sin productos registrados</p>
                  ) : (
                    detail.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 bg-surface-800/40 border border-surface-800/60 rounded-lg px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate">{item.product_name}</p>
                          <p className="text-xs text-surface-500">
                            {item.quantity} × {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-kiosko-500 shrink-0">
                          {formatCurrency(item.total)}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-surface-700 pt-3 space-y-1 text-sm">
                  <div className="flex justify-between text-surface-400">
                    <span>Subtotal</span>
                    <span>{formatCurrency(detail.subtotal)}</span>
                  </div>
                  {detail.discount > 0 && (
                    <div className="flex justify-between text-surface-400">
                      <span>Descuento</span>
                      <span>-{formatCurrency(detail.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white font-bold text-base pt-1">
                    <span>Total</span>
                    <span className="text-kiosko-500">{formatCurrency(detail.total)}</span>
                  </div>
                </div>

                {detail.status === 'completed' && (
                  <div className="mt-5 flex justify-end">
                    <Button
                      variant="danger"
                      onClick={() => void handleCancel({ ...detail })}
                      disabled={cancelling}
                    >
                      <Ban size={15} />
                      {cancelling ? 'Anulando...' : 'Anular venta'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

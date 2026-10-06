import { useState } from 'react';
import {
  BarChart3,
  Wallet,
  CalendarDays,
  Calendar,
  UserCog,
  Trophy,
  Building2,
  ArrowLeft,
  Eye,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import {
  getReport,
  getMonthSales,
  getCostsByMonth,
  type ReportKey,
  type ReportResult,
  type ReportRow,
  type SaleDetail,
} from '../../services/reports.service';
import { formatCurrency, formatDateTime } from '../../utils/format';

const reportOptions: {
  key: ReportKey;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  { key: 'caja', label: 'Historial por caja', description: 'Ventas agrupadas por cada caja', icon: <Wallet size={22} /> },
  { key: 'mes', label: 'Historial por mes', description: 'Totales mes a mes', icon: <CalendarDays size={22} /> },
  { key: 'anio', label: 'Historial por año', description: 'Totales de cada año', icon: <Calendar size={22} /> },
  { key: 'cajero', label: 'Historial por cajero', description: 'Ventas realizadas por cada cajero', icon: <UserCog size={22} /> },
  { key: 'ranking', label: 'Ranking de productos', description: 'Productos más vendidos', icon: <Trophy size={22} /> },
  { key: 'sucursales', label: 'Ventas por sucursal', description: 'Totales de cada sucursal', icon: <Building2 size={22} /> },
];

export function ReportsPage() {
  const { user } = useAuth();
  const [active, setActive] = useState<ReportKey | null>(null);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drill, setDrill] = useState<{ key: string; label: string } | null>(null);
  const [detail, setDetail] = useState<SaleDetail[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [drillCost, setDrillCost] = useState(0);

  const openReport = async (key: ReportKey) => {
    if (!user) return;
    setActive(key);
    setLoading(true);
    setError('');
    setResult(null);
    setDrill(null);
    setDetail([]);
    try {
      setResult(await getReport(key, user.business_id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const openDrill = async (row: ReportRow) => {
    if (!user) return;
    setDrill({ key: row.key, label: row.label });
    setDetailLoading(true);
    setDetailError('');
    setDetail([]);
    setDrillCost(0);
    try {
      const [salesDetail, costs] = await Promise.all([
        getMonthSales(row.key, user.business_id),
        getCostsByMonth(user.business_id),
      ]);
      setDetail(salesDetail);
      setDrillCost(costs.get(row.key) ?? 0);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'No se pudo cargar el detalle');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDrill = () => {
    setDrill(null);
    setDetail([]);
    setDetailError('');
    setDrillCost(0);
  };

  const back = () => {
    if (drill) {
      closeDrill();
      return;
    }
    setActive(null);
    setResult(null);
    setError('');
  };

  if (!active) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-kiosko-600/15 flex items-center justify-center">
            <BarChart3 size={20} className="text-kiosko-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Reportes</h1>
            <p className="text-sm text-surface-400">Elegí qué reporte querés ver</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => void openReport(option.key)}
              className="text-left bg-surface-900 border border-surface-800 rounded-xl p-5 hover:border-kiosko-600/50 hover:bg-surface-800/50 transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-kiosko-600/15 flex items-center justify-center text-kiosko-500 mb-3 group-hover:scale-110 transition-transform">
                {option.icon}
              </div>
              <h2 className="font-semibold text-white">{option.label}</h2>
              <p className="text-sm text-surface-400 mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const option = reportOptions.find((o) => o.key === active);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-kiosko-600/15 flex items-center justify-center">
            {option?.icon ?? <BarChart3 size={20} className="text-kiosko-500" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {drill ? drill.label : (result?.title ?? option?.label)}
            </h1>
            <p className="text-sm text-surface-400">
              {drill ? 'Detalle de ventas del mes' : 'Reporte de ventas'}
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={back}>
          <ArrowLeft size={14} />
          Volver
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/40 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <Card>
          <p className="text-sm text-surface-400 text-center py-10">Generando reporte...</p>
        </Card>
      )}

      {!loading && drill && (
        <>
          {detailLoading && (
            <Card>
              <p className="text-sm text-surface-400 text-center py-10">Cargando detalle...</p>
            </Card>
          )}

          {!detailLoading && detailError && (
            <div className="rounded-lg border border-red-800 bg-red-900/40 px-4 py-3 text-sm text-red-400">
              {detailError}
            </div>
          )}

          {!detailLoading && !detailError && (
            <>
              {(() => {
                const detailTotal = detail.reduce((sum, s) => sum + s.total, 0);
                const detailProfit = detailTotal - drillCost;
                const detailMargin =
                  detailTotal > 0 ? Math.round((detailProfit / detailTotal) * 100) : 0;
                return (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <p className="text-sm text-surface-400">Ventas</p>
                      <p className="text-2xl font-bold text-white mt-1">{detail.length}</p>
                    </Card>
                    <Card>
                      <p className="text-sm text-surface-400">Total</p>
                      <p className="text-2xl font-bold text-kiosko-500 mt-1">
                        {formatCurrency(detailTotal)}
                      </p>
                    </Card>
                    <Card>
                      <p className="text-sm text-surface-400">Costos</p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {formatCurrency(drillCost)}
                      </p>
                    </Card>
                    <Card>
                      <p className="text-sm text-surface-400">Beneficio</p>
                      <p
                        className={`text-2xl font-bold mt-1 ${
                          detailProfit >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {formatCurrency(detailProfit)}
                      </p>
                      <p className="text-xs text-surface-500 mt-1">
                        Rentabilidad: {detailMargin}%
                      </p>
                    </Card>
                  </div>
                );
              })()}

              <Card>
                {detail.length === 0 ? (
                  <p className="text-sm text-surface-500 text-center py-10">
                    Sin ventas en este mes
                  </p>
                ) : (
                  <div className="space-y-2">
                    {detail.map((sale) => (
                      <div
                        key={sale.id}
                        className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-800/40 rounded-lg border border-surface-800/60"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">Venta #{sale.number}</p>
                          <p className="text-xs text-surface-500">
                            {formatDateTime(sale.created_at)}
                          </p>
                        </div>

                        {sale.customer_name ? (
                          <div className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 min-w-0 max-w-[200px]">
                            <p className="text-sm text-white truncate">{sale.customer_name}</p>
                            <p className="text-xs text-surface-400">
                              Saldo actual:{' '}
                              <span
                                className={
                                  (sale.customer_balance ?? 0) > 0
                                    ? 'text-red-400'
                                    : (sale.customer_balance ?? 0) < 0
                                      ? 'text-green-400'
                                      : 'text-surface-400'
                                }
                              >
                                {formatCurrency(sale.customer_balance ?? 0)}
                              </span>
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-surface-600">Sin cliente</span>
                        )}

                        <span
                          className={`inline-flex px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap ${
                            sale.payment_method === 'account'
                              ? 'border-kiosko-600 bg-kiosko-600/10 text-kiosko-500'
                              : 'border-surface-700 bg-surface-800 text-surface-300'
                          }`}
                        >
                          {sale.payment_method_label}
                        </span>

                        <p className="text-sm font-semibold text-kiosko-500 ml-auto">
                          {formatCurrency(sale.total)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </>
      )}

      {!loading && !drill && result && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <p className="text-sm text-surface-400">
                {active === 'ranking' ? 'Unidades vendidas' : 'Ventas'}
              </p>
              <p className="text-2xl font-bold text-white mt-1">{result.grandCount}</p>
            </Card>
            <Card>
              <p className="text-sm text-surface-400">Total</p>
              <p className="text-2xl font-bold text-kiosko-500 mt-1">
                {formatCurrency(result.grandTotal)}
              </p>
            </Card>
          </div>

          <Card padding={false}>
            {result.rows.length === 0 ? (
              <p className="text-sm text-surface-500 text-center py-10">Sin ventas registradas</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-800">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">
                        {active === 'caja'
                          ? 'Caja'
                          : active === 'mes'
                            ? 'Mes'
                            : active === 'anio'
                              ? 'Año'
                              : active === 'cajero'
                                ? 'Cajero'
                                : active === 'ranking'
                                  ? 'Producto'
                                  : 'Sucursal'}
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase">
                        {active === 'ranking' ? 'Unidades' : 'Ventas'}
                      </th>
                      {active === 'mes' && (
                        <>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase hidden md:table-cell">
                            Costos
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase hidden md:table-cell">
                            Beneficio
                          </th>
                        </>
                      )}
                      <th className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Total</th>
                      {active === 'mes' && (
                        <th className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase hidden md:table-cell">
                          Rentabilidad
                        </th>
                      )}
                      <th className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase hidden sm:table-cell">% del total</th>
                      {active === 'mes' && (
                        <th className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase">
                          Ver
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row) => {
                      const pct =
                        result.grandTotal > 0
                          ? Math.round((row.total / result.grandTotal) * 100)
                          : 0;
                      const rowCost = row.cost ?? 0;
                      const rowProfit = row.total - rowCost;
                      const rowMargin =
                        row.total > 0 ? Math.round((rowProfit / row.total) * 100) : 0;
                      return (
                        <tr key={row.key} className="border-b border-surface-800/50 hover:bg-surface-800/30">
                          <td className="px-4 py-3">
                            <p className="font-medium text-white">{row.label}</p>
                            {row.sublabel && <p className="text-xs text-surface-500">{row.sublabel}</p>}
                          </td>
                          <td className="px-4 py-3 text-right text-surface-300">{row.count}</td>
                          {active === 'mes' && (
                            <>
                              <td className="px-4 py-3 text-right text-surface-300 hidden md:table-cell">
                                {formatCurrency(rowCost)}
                              </td>
                              <td
                                className={`px-4 py-3 text-right font-semibold hidden md:table-cell ${
                                  rowProfit >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}
                              >
                                {formatCurrency(rowProfit)}
                              </td>
                            </>
                          )}
                          <td className="px-4 py-3 text-right font-semibold text-kiosko-500">
                            {formatCurrency(row.total)}
                          </td>
                          {active === 'mes' && (
                            <td className="px-4 py-3 text-right text-surface-300 hidden md:table-cell">
                              {rowMargin}%
                            </td>
                          )}
                          <td className="px-4 py-3 text-right text-surface-400 hidden sm:table-cell">
                            {pct}%
                          </td>
                          {active === 'mes' && (
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => void openDrill(row)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-700 bg-surface-800 text-xs text-surface-300 hover:border-kiosko-600 hover:text-kiosko-500 transition-colors"
                              >
                                <Eye size={13} />
                                Ver
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

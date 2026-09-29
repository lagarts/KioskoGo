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
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { getReport, type ReportKey, type ReportResult } from '../../services/reports.service';
import { formatCurrency } from '../../utils/format';

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

  const openReport = async (key: ReportKey) => {
    if (!user) return;
    setActive(key);
    setLoading(true);
    setError('');
    setResult(null);
    try {
      setResult(await getReport(key, user.business_id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const back = () => {
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
            <h1 className="text-2xl font-bold text-white">{result?.title ?? option?.label}</h1>
            <p className="text-sm text-surface-400">Reporte de ventas</p>
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

      {!loading && result && (
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
                      <th className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Total</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase hidden sm:table-cell">% del total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row) => {
                      const pct =
                        result.grandTotal > 0
                          ? Math.round((row.total / result.grandTotal) * 100)
                          : 0;
                      return (
                        <tr key={row.key} className="border-b border-surface-800/50 hover:bg-surface-800/30">
                          <td className="px-4 py-3">
                            <p className="font-medium text-white">{row.label}</p>
                            {row.sublabel && <p className="text-xs text-surface-500">{row.sublabel}</p>}
                          </td>
                          <td className="px-4 py-3 text-right text-surface-300">{row.count}</td>
                          <td className="px-4 py-3 text-right font-semibold text-kiosko-500">
                            {formatCurrency(row.total)}
                          </td>
                          <td className="px-4 py-3 text-right text-surface-400 hidden sm:table-cell">
                            {pct}%
                          </td>
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

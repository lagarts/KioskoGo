import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { getReportsData, type ReportsData } from '../../services/reports.service';
import { formatCurrency } from '../../utils/format';

export function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getReportsData()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudieron cargar los reportes');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card>
          <p className="text-sm text-surface-400 text-center py-10">Cargando...</p>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card>
          <p className="text-sm text-red-400 text-center py-10">
            {error ?? 'No se pudieron cargar los reportes'}
          </p>
        </Card>
      </div>
    );
  }

  const rawPeriod = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  const period = rawPeriod.charAt(0).toUpperCase() + rawPeriod.slice(1);

  const statsCards = [
    { label: 'Ventas del mes', value: formatCurrency(data.monthSalesTotal), icon: <TrendingUp size={20} /> },
    { label: 'Gastos del mes', value: formatCurrency(data.monthExpensesTotal), icon: <DollarSign size={20} /> },
    { label: 'Productos vendidos', value: String(data.itemsSold), icon: <Package size={20} /> },
    { label: 'Ticket promedio', value: formatCurrency(data.avgTicket), icon: <ShoppingCart size={20} /> },
  ];

  const maxAmount = Math.max(...data.salesByDay.map((d) => d.amount), 1);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-kiosko-600/15 flex items-center justify-center">
          <BarChart3 size={20} className="text-kiosko-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Reportes</h1>
          <p className="text-sm text-surface-400">Análisis del período: {period}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-400">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center text-kiosko-500">
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Ventas por día</h2>
          <div className="flex items-end gap-3 h-48">
            {data.salesByDay.map((day) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] text-surface-400">${(day.amount / 1000).toFixed(0)}k</span>
                <div className="w-full rounded-t-lg bg-kiosko-600 transition-all" style={{ height: `${(day.amount / maxAmount) * 120}px` }} />
                <span className="text-xs text-surface-400">{day.day}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Ventas por método de pago</h2>
          <div className="space-y-3">
            {data.salesByPayment.length === 0 ? (
              <p className="text-sm text-surface-500 text-center py-4">Sin ventas en el mes</p>
            ) : (
              data.salesByPayment.map((item) => (
                <div key={item.method} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-300">{item.method}</span>
                    <span className="text-white font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="w-full h-2 bg-surface-800 rounded-full overflow-hidden">
                    <div className="h-full bg-kiosko-600 rounded-full" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Productos más vendidos</h2>
            <Badge variant="info">Top 5</Badge>
          </div>
          <div className="space-y-3">
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-surface-500 text-center py-4">Sin ventas en el mes</p>
            ) : (
              data.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between py-2 border-b border-surface-800/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-surface-500 w-6">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{p.name}</p>
                      <p className="text-xs text-surface-500">{p.sold} vendidos</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-kiosko-500">{formatCurrency(p.revenue)}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Estado de stock</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-900/20 border border-green-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-900/30 flex items-center justify-center"><Package size={14} className="text-green-400" /></div>
                <span className="text-sm text-white">Stock normal</span>
              </div>
              <span className="text-sm font-bold text-green-400">{data.stockStatus.normal} productos</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-900/20 border border-yellow-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-900/30 flex items-center justify-center"><TrendingDown size={14} className="text-yellow-400" /></div>
                <span className="text-sm text-white">Stock bajo</span>
              </div>
              <span className="text-sm font-bold text-yellow-400">{data.stockStatus.low} productos</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-900/20 border border-red-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-900/30 flex items-center justify-center"><Users size={14} className="text-red-400" /></div>
                <span className="text-sm text-white">Sin stock</span>
              </div>
              <span className="text-sm font-bold text-red-400">{data.stockStatus.out} productos</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

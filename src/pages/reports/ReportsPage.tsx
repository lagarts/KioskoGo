import { BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

const statsCards = [
  { label: 'Ventas del mes', value: '$2.450.000', change: '+15%', positive: true, icon: <TrendingUp size={20} /> },
  { label: 'Compras del mes', value: '$1.200.000', change: '-5%', positive: true, icon: <ShoppingCart size={20} /> },
  { label: 'Ganancia estimada', value: '$735.000', change: '+12%', positive: true, icon: <DollarSign size={20} /> },
  { label: 'Productos vendidos', value: '1.847', change: '+8%', positive: true, icon: <Package size={20} /> },
];

const salesByDay = [
  { day: 'Lun', amount: 125000 },
  { day: 'Mar', amount: 98000 },
  { day: 'Mié', amount: 142000 },
  { day: 'Jue', amount: 115000 },
  { day: 'Vie', amount: 178000 },
  { day: 'Sáb', amount: 210000 },
  { day: 'Dom', amount: 85000 },
];

const topProducts = [
  { name: 'Coca Cola 500ml', sold: 148, revenue: '$370.000' },
  { name: 'Pan Francés', sold: 135, revenue: '$202.500' },
  { name: 'Leche La Serenísima', sold: 122, revenue: '$183.000' },
  { name: 'Yerba Mate 1kg', sold: 98, revenue: '$196.000' },
  { name: 'Alfajor Havanna', sold: 88, revenue: '$105.600' },
];

const salesByPayment = [
  { method: 'Efectivo', percentage: 45, amount: '$1.102.500' },
  { method: 'Tarjeta Débito', percentage: 25, amount: '$612.500' },
  { method: 'Tarjeta Crédito', percentage: 15, amount: '$367.500' },
  { method: 'Transferencia', percentage: 10, amount: '$245.000' },
  { method: 'Mercado Pago', percentage: 5, amount: '$122.500' },
];

export function ReportsPage() {
  const maxAmount = Math.max(...salesByDay.map((d) => d.amount));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-kiosko-600/15 flex items-center justify-center">
          <BarChart3 size={20} className="text-kiosko-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Reportes</h1>
          <p className="text-sm text-surface-400">Análisis del período: Septiembre 2026</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-400">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                <span className={`text-xs ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>{stat.change}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center text-kiosko-500">
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales by Day Chart */}
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Ventas por día</h2>
          <div className="flex items-end gap-3 h-48">
            {salesByDay.map((day) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] text-surface-400">${(day.amount / 1000).toFixed(0)}k</span>
                <div className="w-full rounded-t-lg bg-kiosko-600 transition-all" style={{ height: `${(day.amount / maxAmount) * 120}px` }} />
                <span className="text-xs text-surface-400">{day.day}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Payment Methods */}
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Ventas por método de pago</h2>
          <div className="space-y-3">
            {salesByPayment.map((item) => (
              <div key={item.method} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-surface-300">{item.method}</span>
                  <span className="text-white font-medium">{item.amount}</span>
                </div>
                <div className="w-full h-2 bg-surface-800 rounded-full overflow-hidden">
                  <div className="h-full bg-kiosko-600 rounded-full" style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Products */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Productos más vendidos</h2>
            <Badge variant="info">Top 5</Badge>
          </div>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between py-2 border-b border-surface-800/50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-surface-500 w-6">#{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <p className="text-xs text-surface-500">{p.sold} vendidos</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-kiosko-500">{p.revenue}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Stock Status */}
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Estado de stock</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-900/20 border border-green-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-900/30 flex items-center justify-center"><Package size={14} className="text-green-400" /></div>
                <span className="text-sm text-white">Stock normal</span>
              </div>
              <span className="text-sm font-bold text-green-400">42 productos</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-900/20 border border-yellow-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-900/30 flex items-center justify-center"><TrendingDown size={14} className="text-yellow-400" /></div>
                <span className="text-sm text-white">Stock bajo</span>
              </div>
              <span className="text-sm font-bold text-yellow-400">7 productos</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-900/20 border border-red-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-900/30 flex items-center justify-center"><Users size={14} className="text-red-400" /></div>
                <span className="text-sm text-white">Sin stock</span>
              </div>
              <span className="text-sm font-bold text-red-400">3 productos</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

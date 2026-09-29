import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Wallet,
  Package,
  Users,
  Truck,
  Receipt,
  ShoppingCart as PurchaseIcon,
  Warehouse,
  BarChart3,
  Ticket,
  Settings,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { getDashboardData, type DashboardData } from '../services/dashboard.service';
import { formatCurrency } from '../utils/format';

const quickActions = [
  { label: 'Cargar Ventas', path: '/sales/new', icon: <ShoppingCart size={24} />, color: 'bg-kiosko-600 text-black' },
  { label: 'Caja', path: '/cash', icon: <Wallet size={24} />, color: 'bg-kiosko-600 text-black' },
  { label: 'Productos', path: '/products', icon: <Package size={24} />, color: 'bg-surface-800 text-kiosko-500' },
  { label: 'Clientes', path: '/customers', icon: <Users size={24} />, color: 'bg-surface-800 text-kiosko-500' },
  { label: 'Proveedores', path: '/suppliers', icon: <Truck size={24} />, color: 'bg-surface-800 text-kiosko-500' },
  { label: 'Ventas', path: '/sales', icon: <Receipt size={24} />, color: 'bg-surface-800 text-kiosko-500' },
  { label: 'Compras', path: '/purchases', icon: <PurchaseIcon size={24} />, color: 'bg-surface-800 text-kiosko-500' },
  { label: 'Stock', path: '/stock', icon: <Warehouse size={24} />, color: 'bg-surface-800 text-kiosko-500' },
  { label: 'Reportes', path: '/reports', icon: <BarChart3 size={24} />, color: 'bg-surface-800 text-kiosko-500' },
  { label: 'Etiquetas', path: '/labels', icon: <Ticket size={24} />, color: 'bg-surface-800 text-kiosko-500' },
  { label: 'Configuración', path: '/settings', icon: <Settings size={24} />, color: 'bg-surface-800 text-kiosko-500' },
];

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getDashboardData()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudo cargar el dashboard');
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
            {error ?? 'No se pudo cargar el dashboard'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">Ventas de hoy</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(data.todayTotal)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-kiosko-600/15 flex items-center justify-center">
              <TrendingUp size={22} className="text-kiosko-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">Ventas del mes</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(data.monthTotal)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-900/30 flex items-center justify-center">
              <ArrowUpRight size={22} className="text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">Productos</p>
              <p className="text-2xl font-bold text-white mt-1">{data.productCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center">
              <Package size={22} className="text-kiosko-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">Stock bajo</p>
              <p className="text-2xl font-bold text-white mt-1">{data.lowStockCount}</p>
              {data.lowStockCount > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertTriangle size={14} className="text-yellow-400" />
                  <span className="text-xs text-yellow-400">Requiere atención</span>
                </div>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-yellow-900/30 flex items-center justify-center">
              <AlertTriangle size={22} className="text-yellow-400" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-surface-800/50 border border-surface-700/50 hover:border-kiosko-600/50 hover:bg-surface-800 transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <span className="text-xs text-surface-300 text-center font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Alertas de stock</h2>
          <Badge variant="warning">{data.lowStockCount} productos</Badge>
        </div>
        {data.lowStockProducts.length === 0 ? (
          <p className="text-sm text-surface-500 text-center py-4">Todo el stock está bien</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.lowStockProducts.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  item.stock <= 0
                    ? 'bg-red-900/20 border-red-800'
                    : 'bg-yellow-900/20 border-yellow-800'
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-white">{item.name}</p>
                  <p className="text-xs text-surface-400">Stock: {item.stock} · Mín: {item.min_stock}</p>
                </div>
                <Badge variant={item.stock <= 0 ? 'danger' : 'warning'}>
                  {item.stock <= 0 ? 'Agotado' : `${item.stock} uds`}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

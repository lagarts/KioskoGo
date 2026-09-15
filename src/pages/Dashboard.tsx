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
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

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

const topProducts = [
  { name: 'Coca Cola 500ml', sold: 48, revenue: '$120.000' },
  { name: 'Pan Francés', sold: 35, revenue: '$52.500' },
  { name: 'Leche La Serenísima', sold: 32, revenue: '$48.000' },
  { name: 'Alfajor Havanna', sold: 28, revenue: '$33.600' },
  { name: 'Yerba Mate 1kg', sold: 22, revenue: '$44.000' },
];

const recentSales = [
  { id: '#1024', client: 'Consumidor Final', total: '$4.500', method: 'Efectivo', time: '14:32' },
  { id: '#1023', client: 'María López', total: '$8.200', method: 'Tarjeta', time: '14:15' },
  { id: '#1022', client: 'Consumidor Final', total: '$2.100', method: 'Mercado Pago', time: '13:58' },
  { id: '#1021', client: 'Juan Pérez', total: '$15.800', method: 'Transferencia', time: '13:40' },
  { id: '#1020', client: 'Consumidor Final', total: '$3.300', method: 'Efectivo', time: '13:22' },
];

export function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">Ventas de hoy</p>
              <p className="text-2xl font-bold text-white mt-1">$156.800</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp size={14} className="text-green-400" />
                <span className="text-xs text-green-400">+12%</span>
                <span className="text-xs text-surface-500">vs ayer</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-kiosko-600/15 flex items-center justify-center">
              <TrendingUp size={22} className="text-kiosko-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">Ingresos</p>
              <p className="text-2xl font-bold text-white mt-1">$198.500</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp size={14} className="text-green-400" />
                <span className="text-xs text-green-400">+8%</span>
                <span className="text-xs text-surface-500">esta semana</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-900/30 flex items-center justify-center">
              <ArrowUpRight size={22} className="text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">Ganancia estimada</p>
              <p className="text-2xl font-bold text-white mt-1">$47.040</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-surface-500">30% margen</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-kiosko-600/15 flex items-center justify-center">
              <TrendingUp size={22} className="text-kiosko-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">Stock bajo</p>
              <p className="text-2xl font-bold text-white mt-1">7</p>
              <div className="flex items-center gap-1 mt-1">
                <AlertTriangle size={14} className="text-yellow-400" />
                <span className="text-xs text-yellow-400">Requiere atención</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-yellow-900/30 flex items-center justify-center">
              <AlertTriangle size={22} className="text-yellow-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
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

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Sales */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Últimas ventas</h2>
            <Link to="/sales" className="text-sm text-kiosko-500 hover:text-kiosko-400 font-medium">
              Ver todas
            </Link>
          </div>
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b border-surface-800/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center">
                    <Receipt size={14} className="text-surface-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{sale.id} - {sale.client}</p>
                    <p className="text-xs text-surface-500">{sale.time} · {sale.method}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-kiosko-500">{sale.total}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Products */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Productos más vendidos</h2>
            <Link to="/reports" className="text-sm text-kiosko-500 hover:text-kiosko-400 font-medium">
              Ver reporte
            </Link>
          </div>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between py-2 border-b border-surface-800/50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-surface-500 w-6">#{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{product.name}</p>
                    <p className="text-xs text-surface-500">{product.sold} vendidos</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-kiosko-500">{product.revenue}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Stock Alerts */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Alertas de stock</h2>
          <Badge variant="warning">7 productos</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: 'Coca Cola 500ml', stock: 3, min: 10 },
            { name: 'Pan Francés', stock: 2, min: 5 },
            { name: 'Leche La Serenísima', stock: 4, min: 8 },
            { name: 'Alfajor Havanna', stock: 1, min: 5 },
            { name: 'Galletitas Oreo', stock: 3, min: 6 },
            { name: 'Papel Higiénico', stock: 2, min: 10 },
            { name: 'Jabón en Barra', stock: 0, min: 5 },
          ].map((item) => (
            <div
              key={item.name}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                item.stock === 0
                  ? 'bg-red-900/20 border-red-800'
                  : 'bg-yellow-900/20 border-yellow-800'
              }`}
            >
              <div>
                <p className="text-sm font-medium text-white">{item.name}</p>
                <p className="text-xs text-surface-400">Mín: {item.min}</p>
              </div>
              <Badge variant={item.stock === 0 ? 'danger' : 'warning'}>
                {item.stock === 0 ? 'Agotado' : `${item.stock} uds`}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

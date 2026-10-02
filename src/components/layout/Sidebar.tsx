import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Wallet,
  Package,
  Tag,
  Users,
  Truck,
  Receipt,
  ShoppingCart as PurchaseIcon,
  Warehouse,
  ArrowLeftRight,
  Barcode,
  Ticket,
  BarChart3,
  CreditCard,
  FileText,
  ReceiptIcon,
  Settings,
  Shield,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  UserCog,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isSuperadmin } from '../../lib/admin';
import { CAJERO_ALLOWED_PATHS } from '../../lib/roles';
import type { UserRole } from '../../types';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
  adminOnly?: boolean;
  roles?: UserRole[];
}

const menuSections: { title?: string; items: MenuItem[] }[] = [
  {
    items: [
      { label: 'Menu', path: '/', icon: <LayoutDashboard size={20} /> },
      { label: 'Cargar Ventas', path: '/sales/new', icon: <ShoppingCart size={20} /> },
      { label: 'Caja', path: '/cash', icon: <Wallet size={20} /> },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { label: 'Productos', path: '/products', icon: <Package size={20} /> },
      { label: 'Categorías', path: '/categories', icon: <Tag size={20} /> },
      { label: 'Clientes', path: '/customers', icon: <Users size={20} /> },
      { label: 'Proveedores', path: '/suppliers', icon: <Truck size={20} /> },
      { label: 'Sucursales', path: '/branches', icon: <Building2 size={20} />, roles: ['admin'] },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      { label: 'Ventas', path: '/sales', icon: <Receipt size={20} /> },
      { label: 'Compras', path: '/purchases', icon: <PurchaseIcon size={20} /> },
      { label: 'Stock', path: '/stock', icon: <Warehouse size={20} /> },
      { label: 'Transferencias', path: '/transfers', icon: <ArrowLeftRight size={20} /> },
    ],
  },
  {
    title: 'Herramientas',
    items: [
      { label: 'Cód. Barras', path: '/barcode', icon: <Barcode size={20} /> },
      { label: 'Etiquetas', path: '/labels', icon: <Ticket size={20} /> },
      { label: 'Reportes', path: '/reports', icon: <BarChart3 size={20} /> },
      { label: 'Mét. Pago', path: '/payment-methods', icon: <CreditCard size={20} /> },
      { label: 'Ctas. Corrientes', path: '/accounts', icon: <FileText size={20} /> },
      { label: 'Gastos', path: '/expenses', icon: <ReceiptIcon size={20} /> },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { label: 'Configuración', path: '/settings', icon: <Settings size={20} /> },
      { label: 'Cajeros', path: '/cashiers', icon: <UserCog size={20} />, roles: ['admin'] },
      { label: 'Admin', path: '/admin', icon: <Shield size={20} />, adminOnly: true },
      { label: 'Soporte', path: '/support', icon: <HelpCircle size={20} /> },
    ],
  },
];

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const superadmin = isSuperadmin(user?.email);

  const visibleSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (user?.role === 'cajero' && !CAJERO_ALLOWED_PATHS.includes(item.path)) return false;
        if (item.roles && (!user?.role || !item.roles.includes(user.role))) return false;
        if (item.adminOnly && !superadmin) return false;
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 h-16 border-b border-surface-800`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="KioskoGo" className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold text-kiosko-500">KioskoGo</span>
          </div>
        )}
        {collapsed && (
          <img src="/logo.png" alt="KioskoGo" className="w-8 h-8 object-contain" />
        )}
        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="md:hidden text-surface-400 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 no-scrollbar">
        {visibleSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-2">
            {section.title && !collapsed && (
              <div className="px-3 py-1.5 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onMobileClose}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-150
                    ${isActive
                      ? 'bg-kiosko-600/15 text-kiosko-500 font-medium'
                      : 'text-surface-400 hover:bg-surface-800 hover:text-white'
                    }
                    ${collapsed ? 'justify-center' : ''}
                  `}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={isActive ? 'text-kiosko-500' : ''}>{item.icon}</span>
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-surface-800 p-2">
        {!collapsed && (
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-surface-400 hover:bg-red-900/20 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="text-sm">Cerrar sesión</span>
          </button>
        )}
        {collapsed && (
          <button
            onClick={signOut}
            className="flex items-center justify-center w-full p-2.5 rounded-lg text-surface-400 hover:bg-red-900/20 hover:text-red-400 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={20} />
          </button>
        )}
        {/* Collapse toggle - desktop only */}
        <button
          onClick={onToggle}
          className="hidden md:flex items-center justify-center w-full p-2 mt-1 rounded-lg text-surface-500 hover:bg-surface-800 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`
          hidden md:flex flex-col bg-surface-950 border-r border-surface-800
          transition-all duration-300 h-screen sticky top-0 z-30
          ${collapsed ? 'w-[68px]' : 'w-60'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={onMobileClose}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-surface-950 border-r border-surface-800 z-50">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

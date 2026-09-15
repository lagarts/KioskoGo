import { useState } from 'react';
import { Menu, Bell, Search, ChevronDown, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

const mockNotifications = [
  { id: '1', title: 'Stock bajo', message: 'Coca Cola 500ml tiene menos de 5 unidades', type: 'stock', time: 'Hace 5 min' },
  { id: '2', title: 'Caja abierta', message: 'La caja fue abierta por Admin', type: 'cash', time: 'Hace 10 min' },
  { id: '3', title: 'Venta realizada', message: 'Venta #1024 por $4.500', type: 'sale', time: 'Hace 15 min' },
];

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-16 bg-surface-950 border-b border-surface-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden text-surface-400 hover:text-white p-1"
        >
          <Menu size={24} />
        </button>

        {/* Search */}
        <div className="hidden md:flex items-center bg-surface-900 border border-surface-800 rounded-lg px-3 py-2 w-64 lg:w-96">
          <Search size={16} className="text-surface-500 mr-2" />
          <input
            type="text"
            placeholder="Buscar productos, clientes..."
            className="bg-transparent text-sm text-white placeholder-surface-500 outline-none w-full"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative p-2 rounded-lg text-surface-400 hover:bg-surface-800 hover:text-white transition-colors"
          >
            <Bell size={20} />
            {mockNotifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-kiosko-600 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                {mockNotifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-surface-900 border border-surface-700 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-surface-800">
                <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {mockNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="px-4 py-3 border-b border-surface-800/50 hover:bg-surface-800/50 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium text-white">{notif.title}</p>
                      <span className="text-[10px] text-surface-500">{notif.time}</span>
                    </div>
                    <p className="text-xs text-surface-400 mt-0.5">{notif.message}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 text-center border-t border-surface-800">
                <button className="text-xs text-kiosko-500 hover:text-kiosko-400 font-medium">
                  Ver todas las notificaciones
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-kiosko-600 flex items-center justify-center">
              <ShoppingCart size={16} className="text-black" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-white leading-tight">{user?.name}</p>
              <p className="text-[11px] text-surface-500 leading-tight">Admin</p>
            </div>
            <ChevronDown size={14} className="hidden md:block text-surface-500" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-56 bg-surface-900 border border-surface-700 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-surface-800">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-surface-500">{user?.email}</p>
              </div>
              <div className="py-1">
                <button className="w-full px-4 py-2 text-sm text-left text-surface-300 hover:bg-surface-800">
                  Mi perfil
                </button>
                <button className="w-full px-4 py-2 text-sm text-left text-surface-300 hover:bg-surface-800">
                  Configuración
                </button>
                <button className="w-full px-4 py-2 text-sm text-left text-red-400 hover:bg-red-900/20">
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      {(showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </header>
  );
}

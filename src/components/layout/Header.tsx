import { useEffect, useState } from 'react';
import { Menu, Bell, Search, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { listNotifications, markNotificationRead } from '../../services/notifications.service';
import { formatTime } from '../../utils/format';
import type { Notification } from '../../types';

interface HeaderProps {
  onMenuClick: () => void;
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  encargado: 'Encargado',
  cajero: 'Cajero',
};

export function Header({ onMenuClick }: HeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    let active = true;
    listNotifications()
      .then((items) => {
        if (active) setNotifications(items);
      })
      .catch(() => {
        if (active) setNotifications([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const unreadCount = notifications.filter((notif) => !notif.read).length;
  const roleLabel = user ? (roleLabels[user.role] ?? user.role) : '';

  const handleNotificationClick = async (notif: Notification) => {
    if (notif.read) return;
    try {
      await markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
      );
    } catch {
      return;
    }
  };

  const handleSettings = () => {
    setShowUserMenu(false);
    navigate('/settings');
  };

  const handleSignOut = async () => {
    setShowUserMenu(false);
    await signOut().catch(() => undefined);
    navigate('/login');
  };

  return (
    <header className="h-16 bg-surface-950 border-b border-surface-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden text-surface-400 hover:text-white p-1"
        >
          <Menu size={24} />
        </button>

        <div className="hidden md:flex items-center bg-surface-900 border border-surface-800 rounded-lg px-3 py-2 w-64 lg:w-96">
          <Search size={16} className="text-surface-500 mr-2" />
          <input
            type="text"
            placeholder="Buscar productos, clientes..."
            className="bg-transparent text-sm text-white placeholder-surface-500 outline-none w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative p-2 rounded-lg text-surface-400 hover:bg-surface-800 hover:text-white transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-kiosko-600 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-surface-900 border border-surface-700 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-surface-800">
                <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-surface-500 text-center">Sin notificaciones</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (!notif.read) {
                          handleNotificationClick(notif);
                        }
                      }}
                      className={`px-4 py-3 border-b border-surface-800/50 transition-colors ${
                        notif.read
                          ? 'hover:bg-surface-800/50 cursor-default'
                          : 'hover:bg-surface-800/50 cursor-pointer'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm font-medium text-white">{notif.title}</p>
                        <span className="text-[10px] text-surface-500 shrink-0">{formatTime(notif.created_at)}</span>
                      </div>
                      <p className="text-xs text-surface-400 mt-0.5">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
              <img src="/logo2.png" alt="KioskoGo" className="w-full h-full object-contain" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-white leading-tight">{user?.name}</p>
              <p className="text-[11px] text-surface-500 leading-tight">{roleLabel}</p>
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
                <button
                  onClick={handleSettings}
                  className="w-full px-4 py-2 text-sm text-left text-surface-300 hover:bg-surface-800"
                >
                  Configuración
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-sm text-left text-red-400 hover:bg-red-900/20"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

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

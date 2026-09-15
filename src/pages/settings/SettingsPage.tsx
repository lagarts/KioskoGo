import { useState } from 'react';
import { Settings, Store, Users, CreditCard, Printer, Scale, Barcode, Ticket, Wallet, Package, Bell, Shield, Smartphone, Palette, Globe, Lock, HardDrive } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

type SettingsSection = 'business' | 'users' | 'roles' | 'subscription' | 'payment-methods' | 'hardware' | 'labels' | 'tickets' | 'cash' | 'stock' | 'notifications' | 'pwa' | 'security';

const menuItems: { section: SettingsSection; label: string; icon: React.ReactNode }[] = [
  { section: 'business', label: 'Mi Comercio', icon: <Store size={18} /> },
  { section: 'users', label: 'Usuarios', icon: <Users size={18} /> },
  { section: 'roles', label: 'Roles y Permisos', icon: <Shield size={18} /> },
  { section: 'subscription', label: 'Suscripción', icon: <CreditCard size={18} /> },
  { section: 'payment-methods', label: 'Métodos de pago', icon: <Wallet size={18} /> },
  { section: 'hardware', label: 'Hardware', icon: <HardDrive size={18} /> },
  { section: 'labels', label: 'Etiquetas', icon: <Ticket size={18} /> },
  { section: 'tickets', label: 'Tickets', icon: <Printer size={18} /> },
  { section: 'cash', label: 'Caja', icon: <Wallet size={18} /> },
  { section: 'stock', label: 'Stock', icon: <Package size={18} /> },
  { section: 'notifications', label: 'Notificaciones', icon: <Bell size={18} /> },
  { section: 'pwa', label: 'PWA', icon: <Smartphone size={18} /> },
  { section: 'security', label: 'Seguridad', icon: <Lock size={18} /> },
];

function BusinessSection() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Mi Comercio</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Nombre comercial" defaultValue="Kiosco Don Carlos" />
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-1.5">Rubro</label>
          <select defaultValue="kiosco" className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-2.5 text-white outline-none">
            <option value="kiosco">Kiosco</option>
            <option value="almacen">Almacén</option>
            <option value="supermercado">Supermercado</option>
            <option value="carniceria">Carnicería</option>
            <option value="panaderia">Panadería</option>
            <option value="dietetica">Dietética</option>
            <option value="despensa">Despensa</option>
            <option value="fiambre">Fiambrería</option>
            <option value="verduleria">Verdulería</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <Input label="Teléfono" defaultValue="11-5555-0000" />
        <Input label="Email" type="email" defaultValue="contacto@doncarlos.com" />
        <Input label="Dirección" defaultValue="Av. San Martín 1234" />
        <Input label="CUIT" defaultValue="20-30123456-7" />
      </div>
      <Button>Guardar cambios</Button>
    </div>
  );
}

function HardwareSection() {
  const [hardware] = useState({
    scanner: { connected: false, type: 'HID (USB)' },
    printer: { connected: false, type: 'No configurada', size: '' },
    scale: { connected: false, type: 'No conectada' },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Hardware</h2>
      <p className="text-sm text-surface-400">Configura los dispositivos conectados a tu sistema POS</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scanner */}
        <Card>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center">
                <Barcode size={20} className="text-surface-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Lector de código de barras</h3>
                <p className="text-xs text-surface-500">{hardware.scanner.type}</p>
              </div>
            </div>
            <Badge variant={hardware.scanner.connected ? 'success' : 'danger'}>
              {hardware.scanner.connected ? 'Conectado' : 'No conectado'}
            </Badge>
          </div>
          <p className="text-xs text-surface-400 mb-3">
            El lector de código de barras funciona como un teclado HID. Solo necesitás conectarlo por USB y empezar a escanear.
          </p>
          <Button variant="secondary" fullWidth size="sm">
            Configurar lector
          </Button>
        </Card>

        {/* Printer */}
        <Card>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center">
                <Printer size={20} className="text-surface-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Impresora de tickets</h3>
                <p className="text-xs text-surface-500">{hardware.printer.type}</p>
              </div>
            </div>
            <Badge variant={hardware.printer.connected ? 'success' : 'danger'}>
              {hardware.printer.connected ? 'Conectada' : 'No configurada'}
            </Badge>
          </div>
          <p className="text-xs text-surface-400 mb-3">
            Configurá tu impresora térmica para imprimir tickets de venta y cierre de caja.
          </p>
          <div className="flex gap-2 mb-3">
            <Button variant="secondary" size="sm" fullWidth>58mm</Button>
            <Button variant="secondary" size="sm" fullWidth>80mm</Button>
          </div>
          <Button variant="secondary" fullWidth size="sm">
            Configurar impresora
          </Button>
        </Card>

        {/* Scale */}
        <Card>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center">
                <Scale size={20} className="text-surface-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Balanza electrónica</h3>
                <p className="text-xs text-surface-500">{hardware.scale.type}</p>
              </div>
            </div>
            <Badge variant={hardware.scale.connected ? 'success' : 'danger'}>
              {hardware.scale.connected ? 'Conectada' : 'No conectada'}
            </Badge>
          </div>
          <p className="text-xs text-surface-400 mb-3">
            Integración con balanzas electrónicas para productos vendidos por peso.
          </p>
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-3 mb-3">
            <p className="text-xs text-yellow-400 font-medium">Próximamente</p>
            <p className="text-xs text-surface-400 mt-1">La integración con balanzas estará disponible en una próxima actualización.</p>
          </div>
          <Button variant="secondary" fullWidth size="sm" disabled>
            Configurar balanza
          </Button>
        </Card>

        {/* Label Printer */}
        <Card>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center">
                <Ticket size={20} className="text-surface-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Impresora de etiquetas</h3>
                <p className="text-xs text-surface-500">No configurada</p>
              </div>
            </div>
            <Badge variant="danger">No configurada</Badge>
          </div>
          <p className="text-xs text-surface-400 mb-3">
            Imprimí etiquetas con nombre, precio y código de barras de tus productos.
          </p>
          <Button variant="secondary" fullWidth size="sm">
            Configurar impresora de etiquetas
          </Button>
        </Card>
      </div>
    </div>
  );
}

function SubscriptionSection() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Suscripción</h2>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-white">Plan actual</h3>
            <p className="text-sm text-surface-400">Período de prueba gratuito</p>
          </div>
          <Badge variant="success">Activo</Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-surface-400">Inicio del trial</p>
            <p className="text-white font-medium">15/06/2026</p>
          </div>
          <div>
            <p className="text-surface-400">Vencimiento</p>
            <p className="text-white font-medium">15/09/2026</p>
          </div>
          <div>
            <p className="text-surface-400">Días restantes</p>
            <p className="text-kiosko-500 font-bold">0 días</p>
          </div>
          <div>
            <p className="text-surface-400">Estado</p>
            <Badge variant="warning">Trial próximo a vencer</Badge>
          </div>
        </div>
      </Card>

      <h3 className="text-lg font-semibold text-white">Planes disponibles</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-kiosko-600/50">
          <div className="text-center">
            <h4 className="font-bold text-kiosko-500 text-lg">Mensual ARS</h4>
            <p className="text-3xl font-bold text-white mt-2">$15.000</p>
            <p className="text-sm text-surface-400">por mes</p>
            <div className="mt-4 space-y-2 text-sm text-surface-300">
              <p>✓ Todos los módulos</p>
              <p>✓ Soporte prioritario</p>
              <p>✓ Actualizaciones incluidas</p>
              <p>✓ Sin límite de productos</p>
            </div>
            <Button fullWidth className="mt-4">Pagar con Mercado Pago</Button>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <h4 className="font-bold text-surface-300 text-lg">Mensual USD</h4>
            <p className="text-3xl font-bold text-white mt-2">USD 10</p>
            <p className="text-sm text-surface-400">por mes</p>
            <div className="mt-4 space-y-2 text-sm text-surface-300">
              <p>✓ Todos los módulos</p>
              <p>✓ Soporte prioritario</p>
              <p>✓ Actualizaciones incluidas</p>
              <p>✓ Sin límite de productos</p>
            </div>
            <Button variant="secondary" fullWidth className="mt-4">Pagar con PayPal</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function UsersSection() {
  const mockUsers = [
    { name: 'Carlos García', email: 'carlos@doncarlos.com', role: 'Administrador', status: 'active' },
    { name: 'María López', email: 'maria@doncarlos.com', role: 'Cajero', status: 'active' },
    { name: 'Juan Pérez', email: 'juan@doncarlos.com', role: 'Encargado', status: 'active' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Usuarios</h2>
        <Button size="sm"><Users size={14} /> Nuevo usuario</Button>
      </div>
      <Card padding={false}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-800">
              <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Nombre</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Rol</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Estado</th>
            </tr>
          </thead>
          <tbody>
            {mockUsers.map((u) => (
              <tr key={u.email} className="border-b border-surface-800/50">
                <td className="px-4 py-3 font-medium text-white">{u.name}</td>
                <td className="px-4 py-3 text-surface-300">{u.email}</td>
                <td className="px-4 py-3"><Badge>{u.role}</Badge></td>
                <td className="px-4 py-3 text-center"><Badge variant="success">Activo</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('business');

  const renderSection = () => {
    switch (activeSection) {
      case 'business': return <BusinessSection />;
      case 'hardware': return <HardwareSection />;
      case 'subscription': return <SubscriptionSection />;
      case 'users': return <UsersSection />;
      default:
        return (
          <div className="flex flex-col items-center py-16">
            <Settings size={48} className="text-surface-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Próximamente</h3>
            <p className="text-sm text-surface-400">Esta sección está en desarrollo.</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-kiosko-600/15 flex items-center justify-center">
          <Settings size={20} className="text-kiosko-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Configuración</h1>
          <p className="text-sm text-surface-400">Administra tu comercio</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Menu */}
        <div className="lg:w-60 shrink-0">
          <Card className="lg:sticky lg:top-24">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.section}
                  onClick={() => setActiveSection(item.section)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeSection === item.section
                      ? 'bg-kiosko-600/15 text-kiosko-500 font-medium'
                      : 'text-surface-400 hover:bg-surface-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}

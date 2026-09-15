import { useState, useEffect } from 'react';
import { Wallet, Lock, Unlock, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Clock, User } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { formatCurrency, formatDateTime } from '../../utils/format';

interface CashRegisterState {
  isOpen: boolean;
  registerId?: string;
  openingAmount?: number;
  openedAt?: string;
  userName?: string;
}

const mockMovements = [
  { type: 'sale_in', amount: 4500, description: 'Venta #1024 - Efectivo', time: '14:32' },
  { type: 'sale_in', amount: 2100, description: 'Venta #1022 - Efectivo', time: '13:58' },
  { type: 'sale_in', amount: 3300, description: 'Venta #1020 - Efectivo', time: '13:22' },
  { type: 'expense', amount: -1500, description: 'Gasto - Papel térmico', time: '12:00' },
  { type: 'sale_in', amount: 8200, description: 'Venta #1019 - Efectivo', time: '11:45' },
  { type: 'sale_in', amount: 1200, description: 'Venta #1018 - Efectivo', time: '11:20' },
];

export function CashPage() {
  const [cashState, setCashState] = useState<CashRegisterState>(() => {
    const saved = localStorage.getItem('kioskogo_cash_register');
    return saved ? JSON.parse(saved) : { isOpen: false };
  });
  const [openingAmount, setOpeningAmount] = useState('');
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('kioskogo_cash_register', JSON.stringify(cashState));
  }, [cashState]);

  const handleOpenCash = () => {
    const amount = parseFloat(openingAmount) || 0;
    setCashState({
      isOpen: true,
      registerId: 'CR-' + Date.now(),
      openingAmount: amount,
      openedAt: new Date().toISOString(),
      userName: 'Administrador',
    });
    setShowOpenModal(false);
    setOpeningAmount('');
  };

  const handleCloseCash = () => {
    setCashState({ isOpen: false });
    setShowCloseModal(false);
  };

  const totalSales = mockMovements
    .filter((m) => m.type === 'sale_in')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalExpenses = mockMovements
    .filter((m) => m.type === 'expense')
    .reduce((sum, m) => sum + Math.abs(m.amount), 0);

  if (!cashState.isOpen) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-kiosko-600/15 flex items-center justify-center">
            <Wallet size={20} className="text-kiosko-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Caja</h1>
            <p className="text-sm text-surface-400">Estado de la caja</p>
          </div>
        </div>

        <Card>
          <div className="flex flex-col items-center py-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-surface-800 flex items-center justify-center mb-4">
              <Lock size={36} className="text-surface-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Caja cerrada</h2>
            <p className="text-sm text-surface-400 mb-6 max-w-md">
              No hay una caja abierta. Debes abrir una caja antes de comenzar a vender.
            </p>
            <Button size="xl" onClick={() => setShowOpenModal(true)}>
              <Unlock size={20} />
              ABRIR CAJA
            </Button>
          </div>
        </Card>

        {/* Open Cash Modal */}
        {showOpenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowOpenModal(false)} />
            <div className="relative bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-md p-6 space-y-4">
              <h2 className="text-xl font-bold text-white text-center">Abrir Caja</h2>
              <Input
                label="Monto inicial"
                type="number"
                placeholder="0.00"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                icon={<Wallet size={16} />}
              />
              <div className="text-sm text-surface-400">
                <p>Fecha: {new Date().toLocaleDateString('es-AR')}</p>
                <p>Hora: {new Date().toLocaleTimeString('es-AR')}</p>
                <p>Usuario: Administrador</p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => setShowOpenModal(false)}>
                  Cancelar
                </Button>
                <Button fullWidth onClick={handleOpenCash}>
                  ABRIR CAJA
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-600/15 flex items-center justify-center">
            <Unlock size={20} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Caja</h1>
            <div className="flex items-center gap-2">
              <Badge variant="success">Abierta</Badge>
              <span className="text-xs text-surface-500">
                desde {cashState.openedAt ? formatDateTime(cashState.openedAt) : ''}
              </span>
            </div>
          </div>
        </div>
        <Button variant="danger" onClick={() => setShowCloseModal(true)}>
          <Lock size={16} />
          Cerrar caja
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">Monto inicial</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(cashState.openingAmount || 0)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center">
              <Wallet size={22} className="text-surface-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">Ventas en efectivo</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(totalSales)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-900/30 flex items-center justify-center">
              <TrendingUp size={22} className="text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">Egresos / Gastos</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-900/30 flex items-center justify-center">
              <TrendingDown size={22} className="text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Movements */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Movimientos</h2>
          <Badge>{mockMovements.length} movimientos</Badge>
        </div>
        <div className="space-y-2">
          {mockMovements.map((mov, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-3 border-b border-surface-800/50 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    mov.type === 'sale_in' ? 'bg-green-900/30' : 'bg-red-900/30'
                  }`}
                >
                  {mov.type === 'sale_in' ? (
                    <ArrowUpRight size={14} className="text-green-400" />
                  ) : (
                    <ArrowDownRight size={14} className="text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{mov.description}</p>
                  <div className="flex items-center gap-2 text-xs text-surface-500">
                    <Clock size={10} />
                    <span>{mov.time}</span>
                    <User size={10} />
                    <span>Admin</span>
                  </div>
                </div>
              </div>
              <span
                className={`text-sm font-semibold ${
                  mov.amount >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {mov.amount >= 0 ? '+' : ''}{formatCurrency(mov.amount)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Close Cash Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowCloseModal(false)} />
          <div className="relative bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold text-white text-center">Cerrar Caja</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-surface-300">
                <span>Monto inicial</span>
                <span>{formatCurrency(cashState.openingAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-surface-300">
                <span>Ventas en efectivo</span>
                <span className="text-green-400">{formatCurrency(totalSales)}</span>
              </div>
              <div className="flex justify-between text-surface-300">
                <span>Gastos</span>
                <span className="text-red-400">-{formatCurrency(totalExpenses)}</span>
              </div>
              <div className="border-t border-surface-700 pt-2 flex justify-between font-bold text-white">
                <span>Monto esperado</span>
                <span>{formatCurrency((cashState.openingAmount || 0) + totalSales - totalExpenses)}</span>
              </div>
            </div>
            <Input
              label="Monto declarado"
              type="number"
              placeholder="0.00"
            />
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setShowCloseModal(false)}>
                Cancelar
              </Button>
              <Button variant="danger" fullWidth onClick={handleCloseCash}>
                Cerrar caja
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

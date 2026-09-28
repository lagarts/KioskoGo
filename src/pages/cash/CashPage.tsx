import { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Lock,
  Unlock,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Clock,
  User,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { formatCurrency, formatDateTime, formatTime } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import {
  getOpenRegister,
  openRegister,
  closeRegister,
  listMovements,
} from '../../services/cash.service';
import type { CashMovement, CashRegister } from '../../types';

interface MovementWithUser extends CashMovement {
  profiles?: { name: string } | null;
}

const positiveTypes = ['sale_in', 'opening', 'income'];

export function CashPage() {
  const { user } = useAuth();
  const [register, setRegister] = useState<CashRegister | null>(null);
  const [movements, setMovements] = useState<MovementWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  const loadMovements = useCallback(async (registerId: string) => {
    const data = await listMovements(registerId);
    setMovements(data);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setError('');
        const open = await getOpenRegister();
        setRegister(open);
        if (open) {
          await loadMovements(open.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando la caja');
      } finally {
        setLoading(false);
      }
    })();
  }, [loadMovements]);

  const handleOpenCash = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      const amount = parseFloat(openingAmount) || 0;
      const newRegister = await openRegister(amount, user.id, user.business_id);
      setRegister(newRegister);
      setMovements([]);
      setShowOpenModal(false);
      setOpeningAmount('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo abrir la caja');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseCash = async () => {
    if (!register || !user || saving) return;
    setSaving(true);
    try {
      const declared = parseFloat(closingAmount) || 0;
      await closeRegister(register, declared, expectedAmount, user.id);
      setRegister(null);
      setMovements([]);
      setShowCloseModal(false);
      setClosingAmount('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo cerrar la caja');
    } finally {
      setSaving(false);
    }
  };

  const totalSales = movements
    .filter((m) => m.type === 'sale_in' || m.type === 'income')
    .reduce((sum, m) => sum + Number(m.amount), 0);

  const totalExpenses = movements
    .filter((m) => m.type === 'expense' || m.type === 'sale_out')
    .reduce((sum, m) => sum + Math.abs(Number(m.amount)), 0);

  const expectedAmount = (register ? Number(register.opening_amount) : 0) + totalSales - totalExpenses;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-kiosko-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-surface-400 text-sm">Cargando caja...</p>
        </div>
      </div>
    );
  }

  if (!register) {
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

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

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
                <p>Usuario: {user?.name}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => setShowOpenModal(false)}>
                  Cancelar
                </Button>
                <Button fullWidth onClick={handleOpenCash} disabled={saving}>
                  {saving ? 'Abriendo...' : 'ABRIR CAJA'}
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
                desde {formatDateTime(register.opened_at)}
              </span>
            </div>
          </div>
        </div>
        <Button variant="danger" onClick={() => setShowCloseModal(true)}>
          <Lock size={16} />
          Cerrar caja
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">Monto inicial</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(Number(register.opening_amount))}
              </p>
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
              <p className="text-2xl font-bold text-green-400 mt-1">
                {formatCurrency(totalSales)}
              </p>
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
              <p className="text-2xl font-bold text-red-400 mt-1">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-900/30 flex items-center justify-center">
              <TrendingDown size={22} className="text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Movimientos</h2>
          <Badge>{movements.length} movimientos</Badge>
        </div>
        {movements.length === 0 ? (
          <p className="text-sm text-surface-500 text-center py-6">
            Sin movimientos en esta caja
          </p>
        ) : (
          <div className="space-y-2">
            {movements.map((mov) => {
              const isPositive = positiveTypes.includes(mov.type) && Number(mov.amount) >= 0;
              const isNeutral = mov.type === 'closing' || mov.type === 'adjustment';
              return (
                <div
                  key={mov.id}
                  className="flex items-center justify-between py-3 border-b border-surface-800/50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isNeutral
                          ? 'bg-surface-800'
                          : isPositive
                            ? 'bg-green-900/30'
                            : 'bg-red-900/30'
                      }`}
                    >
                      {isNeutral ? (
                        <Wallet size={14} className="text-surface-400" />
                      ) : isPositive ? (
                        <ArrowUpRight size={14} className="text-green-400" />
                      ) : (
                        <ArrowDownRight size={14} className="text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{mov.description}</p>
                      <div className="flex items-center gap-2 text-xs text-surface-500">
                        <Clock size={10} />
                        <span>{formatTime(mov.created_at)}</span>
                        <User size={10} />
                        <span>{mov.profiles?.name ?? '—'}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      isNeutral
                        ? 'text-surface-300'
                        : isPositive
                          ? 'text-green-400'
                          : 'text-red-400'
                    }`}
                  >
                    {isPositive ? '+' : ''}
                    {formatCurrency(Number(mov.amount))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowCloseModal(false)} />
          <div className="relative bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold text-white text-center">Cerrar Caja</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-surface-300">
                <span>Monto inicial</span>
                <span>{formatCurrency(Number(register.opening_amount))}</span>
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
                <span>{formatCurrency(expectedAmount)}</span>
              </div>
            </div>
            <Input
              label="Monto declarado"
              type="number"
              placeholder="0.00"
              value={closingAmount}
              onChange={(e) => setClosingAmount(e.target.value)}
            />
            {closingAmount && (
              <div
                className={`text-sm text-center ${
                  (parseFloat(closingAmount) || 0) - expectedAmount === 0
                    ? 'text-green-400'
                    : 'text-yellow-400'
                }`}
              >
                Diferencia: {formatCurrency((parseFloat(closingAmount) || 0) - expectedAmount)}
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setShowCloseModal(false)}>
                Cancelar
              </Button>
              <Button variant="danger" fullWidth onClick={handleCloseCash} disabled={saving}>
                {saving ? 'Cerrando...' : 'Cerrar caja'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

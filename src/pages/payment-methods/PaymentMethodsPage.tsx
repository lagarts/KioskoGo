import { useEffect, useState } from 'react';
import { CreditCard, Lock, Info } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import {
  listPaymentMethods,
  ensureDefaultPaymentMethods,
  createPaymentMethod,
  deletePaymentMethod,
  type PaymentMethodItem,
  type PaymentMethodKind,
} from '../../services/paymentMethods.service';

export function PaymentMethodsPage() {
  const { user } = useAuth();
  const [methods, setMethods] = useState<PaymentMethodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [label, setLabel] = useState('');
  const [kind, setKind] = useState<PaymentMethodKind>('cobro');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    try {
      setError('');
      await ensureDefaultPaymentMethods(user.business_id);
      setMethods(await listPaymentMethods());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los métodos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.business_id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const clean = label.trim();
    if (!clean) return;
    if (methods.some((m) => m.label.toLowerCase() === clean.toLowerCase())) {
      setError('Ya existe un método con ese nombre');
      return;
    }
    setSaving(true);
    try {
      const created = await createPaymentMethod(clean, user.business_id, kind);
      setMethods((prev) => [...prev, created]);
      setLabel('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar el método');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (method: PaymentMethodItem) => {
    if (method.code === 'cash') return;
    if (!confirm(`¿Eliminar el método "${method.label}"?`)) return;
    try {
      await deletePaymentMethod(method.id);
      setMethods((prev) => prev.filter((m) => m.id !== method.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo eliminar el método');
    }
  };

  const cobroCount = methods.filter((m) => m.kind === 'cobro').length;
  const pagoCount = methods.filter((m) => m.kind === 'pago').length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-kiosko-600/15 flex items-center justify-center">
          <CreditCard size={20} className="text-kiosko-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Métodos de Pago</h1>
          <p className="text-sm text-surface-400">Agregá o eliminá los métodos que aceptás</p>
        </div>
      </div>

      <Card>
        <h2 className="text-lg font-bold text-green-500 mb-1">Métodos de pago</h2>
        <p className="text-sm text-surface-400 mb-4">
          Estos métodos aparecen en el Panel de Cobro del Cargar Ventas / POS.
        </p>

        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Nombre del método"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={40}
              autoComplete="off"
            />
          </div>
          <div className="flex items-end gap-3">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as PaymentMethodKind)}
              className="bg-surface-800 border border-surface-700 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-kiosko-500/50"
            >
              <option value="cobro">Cobro</option>
              <option value="pago">Pago</option>
            </select>
            <Button type="submit" variant="success" disabled={saving || !label.trim()}>
              {saving ? 'Agregando...' : 'Agregar'}
            </Button>
          </div>
        </form>

        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

        <p className="text-sm text-surface-300 mt-4">
          Métodos de cobro: <span className="font-bold text-white">{cobroCount}</span>
          {' | '}
          Métodos de pago: <span className="font-bold text-white">{pagoCount}</span>
        </p>
      </Card>

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-surface-400 text-center py-10">Cargando...</p>
        ) : (
          methods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between gap-3 bg-surface-800/60 border border-surface-700 rounded-xl px-5 py-4"
            >
              <div className="min-w-0">
                <p className="text-base font-bold text-white uppercase tracking-wide truncate">
                  {method.label}
                </p>
                <p className="text-xs text-surface-400 capitalize">{method.kind}</p>
              </div>
              {method.code === 'cash' ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-surface-500 border border-surface-700 rounded px-2 py-1 shrink-0">
                  <Lock size={11} />
                  Obligatorio
                </span>
              ) : (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => void handleDelete(method)}
                >
                  Eliminar
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex items-start gap-2 text-xs text-surface-500">
        <Info size={14} className="shrink-0 mt-0.5" />
        <p>
          Los métodos de <strong className="text-surface-300">cobro</strong> son los que elige el
          cliente al pagar en el POS. "Efectivo" es obligatorio por la caja, y si eliminás "Cuenta
          Corriente" se desactiva esa opción en las ventas.
        </p>
      </div>
    </div>
  );
}

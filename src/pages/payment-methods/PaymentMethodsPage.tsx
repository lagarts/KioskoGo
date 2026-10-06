import { useEffect, useState } from 'react';
import { CreditCard, Plus, Trash2, Lock, Info } from 'lucide-react';
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
} from '../../services/paymentMethods.service';

export function PaymentMethodsPage() {
  const { user } = useAuth();
  const [methods, setMethods] = useState<PaymentMethodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [label, setLabel] = useState('');
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
      const created = await createPaymentMethod(clean, user.business_id);
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
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              label="Nuevo método"
              placeholder="Ej.: Cheque, Billetera Virtual, Cripto..."
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={40}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={saving || !label.trim()}>
              <Plus size={16} />
              {saving ? 'Agregando...' : 'Agregar'}
            </Button>
          </div>
        </form>
        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
      </Card>

      <Card padding={false}>
        {loading ? (
          <p className="text-sm text-surface-400 text-center py-10">Cargando...</p>
        ) : (
          <div className="divide-y divide-surface-800">
            {methods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-surface-800 border border-surface-700 flex items-center justify-center shrink-0">
                    <CreditCard size={14} className="text-kiosko-500" />
                  </div>
                  <p className="text-sm font-medium text-white truncate">{method.label}</p>
                  {method.code === 'cash' && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-surface-500 border border-surface-700 rounded px-2 py-0.5 shrink-0">
                      <Lock size={10} />
                      No se puede eliminar
                    </span>
                  )}
                </div>
                {method.code !== 'cash' && (
                  <button
                    onClick={() => void handleDelete(method)}
                    className="p-2 rounded-lg text-surface-400 hover:text-red-400 hover:bg-red-900/20 transition-colors shrink-0"
                    title="Eliminar método"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex items-start gap-2 text-xs text-surface-500">
        <Info size={14} className="shrink-0 mt-0.5" />
        <p>
          Estos son los métodos que aparecen al cobrar en el POS. "Efectivo" es obligatorio por la
          caja, y si eliminás "Cuenta Corriente" se desactiva esa opción en las ventas.
        </p>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { UserPlus, Plus, Trash2, X, Users, KeyRound, Mail } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { createCashier, listCashiers, removeCashier } from '../../services/cashiers.service';
import { isValidUsername, displayUserEmail } from '../../lib/username';
import type { User } from '../../types';
import { formatDate } from '../../utils/format';

export function CashiersPage() {
  const { user } = useAuth();
  const [cashiers, setCashiers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', username: '', password: '' });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setCashiers(await listCashiers(user.business_id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los cajeros');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const username = formData.username.trim().toLowerCase();
    if (!isValidUsername(username)) {
      setError('Usuario inválido: 3 a 20 caracteres (letras, números, . o _), sin espacios ni @');
      return;
    }
    setSaving(true);
    setError(null);
    setMessage('');
    try {
      await createCashier(username, formData.name, formData.password);
      setShowForm(false);
      setFormData({ name: '', username: '', password: '' });
      setMessage(`Cuenta de ${username} creada. Ya puede ingresar con su usuario y contraseña.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el cajero');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cashier: User) => {
    if (!confirm(`¿Eliminar la cuenta de ${cashier.name}?`)) return;
    setError(null);
    setMessage('');
    try {
      await removeCashier(cashier.id);
      setMessage(`Cuenta de ${cashier.name} eliminada.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el cajero');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto">
        <Card>
          <p className="text-sm text-surface-400 text-center py-10">
            No tenés acceso a este módulo.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-kiosko-600/15 flex items-center justify-center">
            <UserPlus size={20} className="text-kiosko-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Cajeros</h1>
            <p className="text-sm text-surface-400">
              Cuentas con acceso limitado: Caja y Cargar Ventas
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setFormData({ name: '', username: '', password: '' });
            setError(null);
            setShowForm(true);
          }}
        >
          <Plus size={16} />
          Nuevo cajero
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/40 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-green-800 bg-green-900/40 px-4 py-3 text-sm text-green-400">
          {message}
        </div>
      )}

      <Card padding={false}>
        {loading ? (
          <p className="text-sm text-surface-400 text-center py-10">Cargando...</p>
        ) : cashiers.length === 0 ? (
          <div className="text-center py-10">
            <Users size={32} className="text-surface-600 mx-auto mb-3" />
            <p className="text-sm text-surface-400">No hay cajeros creados todavía</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Nombre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Usuario</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase hidden md:table-cell">Alta</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Rol</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cashiers.map((cashier) => (
                  <tr key={cashier.id} className="border-b border-surface-800/50 hover:bg-surface-800/30">
                    <td className="px-4 py-3 font-medium text-white">{cashier.name}</td>
                    <td className="px-4 py-3 text-surface-300">{displayUserEmail(cashier.email)}</td>
                    <td className="px-4 py-3 text-surface-300 hidden md:table-cell">
                      {formatDate(cashier.created_at)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="info">Cajero</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => void handleDelete(cashier)}
                        className="p-1.5 rounded-lg hover:bg-red-900/30 text-surface-400 hover:text-red-400"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <KeyRound size={14} className="text-kiosko-500" />
          Accesos del cajero
        </h2>
        <ul className="text-sm text-surface-400 space-y-1">
          <li>✓ Caja — abrir, cerrar y ver movimientos</li>
          <li>✓ Cargar Ventas — punto de venta</li>
        </ul>
        <p className="text-xs text-surface-500 mt-2">
          El cajero no ve productos, reportes, configuración ni el resto del menú.
        </p>
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowForm(false)} />
          <div className="relative bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Nuevo cajero</h2>
              <button onClick={() => setShowForm(false)} className="text-surface-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nombre *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del cajero"
                required
              />
              <Input
                label="Usuario *"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="ej: juan123"
                icon={<Mail size={16} />}
                autoComplete="off"
                required
                maxLength={20}
              />
              <Input
                label="Contraseña *"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                icon={<KeyRound size={16} />}
                required
                minLength={6}
              />
              <p className="text-xs text-surface-500">
                El cajero ingresa con su usuario y contraseña (sin @). Podés eliminar la cuenta desde esta pantalla.
              </p>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" fullWidth onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" fullWidth disabled={saving}>
                  {saving ? 'Creando...' : 'Crear cajero'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

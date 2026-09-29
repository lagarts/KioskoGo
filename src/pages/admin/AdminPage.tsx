import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Gift, RefreshCw, ShieldCheck, Trash2, Users, Clock, UserX } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { isSuperadmin } from '../../lib/admin';
import {
  adminDeleteUser,
  adminGrantForever,
  listAdminUsers,
  type AdminUserRow,
} from '../../services/admin.service';
import { formatDate } from '../../utils/format';

const statusLabels: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }> = {
  trial: { label: 'Prueba', variant: 'warning' },
  active: { label: 'Activo', variant: 'success' },
  past_due: { label: 'Pago pendiente', variant: 'warning' },
  expired: { label: 'Vencido', variant: 'danger' },
  cancelled: { label: 'Cancelado', variant: 'danger' },
  blocked: { label: 'Bloqueado', variant: 'danger' },
};

function isForever(u: AdminUserRow): boolean {
  return u.sub_status === 'active' && !u.trial_ends_at;
}

function timeLeftCell(u: AdminUserRow): ReactNode {
  if (isForever(u)) {
    return <span className="text-green-400 font-semibold">Ilimitado</span>;
  }
  if (u.trial_ends_at) {
    const days = u.days_left ?? 0;
    const cls = days <= 0 ? 'text-red-400' : days <= 15 ? 'text-yellow-400' : 'text-white';
    return (
      <span className={cls}>
        {days > 0 ? `${days} días restantes` : 'Vencido'}
        <span className="block text-xs text-surface-500">vence {formatDate(u.trial_ends_at)}</span>
      </span>
    );
  }
  return <span className="text-surface-500">—</span>;
}

export function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<AdminUserRow | null>(null);

  const authorized = isSuperadmin(user?.email);

  const load = useCallback(async () => {
    setError('');
    try {
      setUsers(await listAdminUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authorized) void load();
    else setLoading(false);
  }, [authorized, load]);

  const handleGrant = async (u: AdminUserRow) => {
    setBusyId(u.user_id);
    setMessage('');
    setError('');
    try {
      await adminGrantForever(u.user_id);
      setMessage(`${u.user_name} ahora es gratis para siempre.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo otorgar la suscripción');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmTarget) return;
    setBusyId(confirmTarget.user_id);
    setMessage('');
    setError('');
    try {
      await adminDeleteUser(confirmTarget.user_id);
      setMessage(`Usuario ${confirmTarget.user_name} eliminado.`);
      setConfirmTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el usuario');
    } finally {
      setBusyId(null);
    }
  };

  if (!authorized) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card>
          <div className="text-center py-10">
            <ShieldCheck size={32} className="text-surface-600 mx-auto mb-3" />
            <p className="text-sm text-surface-400">No tenés acceso a este panel.</p>
          </div>
        </Card>
      </div>
    );
  }

  const inTrial = users.filter((u) => u.sub_status === 'trial').length;
  const forever = users.filter(isForever).length;
  const expired = users.filter((u) => u.days_left === 0 || u.sub_status === 'expired').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck size={24} className="text-kiosko-500" />
            Administración
          </h1>
          <p className="text-sm text-surface-400 mt-1">Usuarios registrados y suscripciones de la plataforma</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setLoading(true);
            void load();
          }}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">Usuarios</p>
              <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-surface-800 flex items-center justify-center">
              <Users size={20} className="text-kiosko-500" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">En prueba</p>
              <p className="text-2xl font-bold text-white mt-1">{inTrial}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-yellow-900/30 flex items-center justify-center">
              <Clock size={20} className="text-yellow-400" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">Gratis para siempre</p>
              <p className="text-2xl font-bold text-white mt-1">{forever}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-green-900/30 flex items-center justify-center">
              <Gift size={20} className="text-green-400" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">Vencidos</p>
              <p className="text-2xl font-bold text-white mt-1">{expired}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-red-900/30 flex items-center justify-center">
              <UserX size={20} className="text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {message && (
        <div className="bg-green-900/30 border border-green-800 text-green-400 text-sm px-4 py-3 rounded-lg">
          {message}
        </div>
      )}

      <Card padding={false}>
        {loading ? (
          <p className="text-sm text-surface-400 text-center py-10">Cargando usuarios...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-surface-500 text-center py-10">Todavía no hay usuarios registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-surface-500 border-b border-surface-800">
                  <th className="py-3 px-4 md:px-6 font-semibold">Usuario</th>
                  <th className="py-3 px-4 font-semibold">Comercio</th>
                  <th className="py-3 px-4 font-semibold">Registrado</th>
                  <th className="py-3 px-4 font-semibold">Suscripción</th>
                  <th className="py-3 px-4 font-semibold">Tiempo restante</th>
                  <th className="py-3 px-4 md:px-6 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const foreverUser = isForever(u);
                  const isSelf = u.user_id === user?.id;
                  return (
                    <tr key={u.user_id} className="border-b border-surface-800/50 last:border-0 hover:bg-surface-800/30">
                      <td className="py-3 px-4 md:px-6">
                        <p className="font-medium text-white flex items-center gap-2">
                          {u.user_name}
                          {isSelf && <Badge variant="info">Tu cuenta</Badge>}
                        </p>
                        <p className="text-xs text-surface-500">{u.user_email}</p>
                      </td>
                      <td className="py-3 px-4 text-surface-300">{u.business_name ?? '—'}</td>
                      <td className="py-3 px-4 text-surface-300 whitespace-nowrap">
                        {formatDate(u.registered_at)}
                      </td>
                      <td className="py-3 px-4">
                        {foreverUser ? (
                          <Badge variant="success">Gratis para siempre</Badge>
                        ) : u.sub_status ? (
                          <Badge variant={statusLabels[u.sub_status]?.variant ?? 'info'}>
                            {statusLabels[u.sub_status]?.label ?? u.sub_status}
                          </Badge>
                        ) : (
                          <Badge>Sin suscripción</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">{timeLeftCell(u)}</td>
                      <td className="py-3 px-4 md:px-6">
                        <div className="flex items-center justify-end gap-2">
                          {!foreverUser && (
                            <Button
                              variant="success"
                              size="sm"
                              disabled={busyId === u.user_id}
                              onClick={() => void handleGrant(u)}
                              title="Dar gratis para siempre"
                            >
                              <Gift size={14} />
                              Dar gratis
                            </Button>
                          )}
                          {!isSelf && (
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={busyId === u.user_id}
                              onClick={() => setConfirmTarget(u)}
                              title="Eliminar usuario"
                            >
                              <Trash2 size={14} />
                              Eliminar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setConfirmTarget(null)} />
          <div className="relative bg-surface-900 border border-surface-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Eliminar usuario</h3>
            <p className="text-sm text-surface-400">
              ¿Seguro que querés eliminar a <span className="text-white font-medium">{confirmTarget.user_name}</span>?
              Se borrará su cuenta y todos sus datos. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmTarget(null)}
                disabled={busyId === confirmTarget.user_id}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => void handleDelete()}
                disabled={busyId === confirmTarget.user_id}
              >
                {busyId === confirmTarget.user_id ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Building2, Plus, Search, Edit, Trash2, X, MapPin, Pause, Play } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import {
  listBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../../services/branches.service';
import type { Branch } from '../../types';

export function BranchesPage() {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '' });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setBranches(await listBranches());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las sucursales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.address ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setFormData({ name: '', address: '' });
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || saving) return;
    setSaving(true);
    try {
      if (editing) {
        await updateBranch(editing.id, formData);
      } else {
        await createBranch(formData, user.business_id);
      }
      setShowForm(false);
      resetForm();
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar la sucursal');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditing(branch);
    setFormData({ name: branch.name, address: branch.address ?? '' });
    setShowForm(true);
  };

  const handleDelete = async (branch: Branch) => {
    if (!confirm(`¿Eliminar la sucursal "${branch.name}"?`)) return;
    try {
      await deleteBranch(branch.id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar la sucursal');
    }
  };

  const handleToggle = async (branch: Branch) => {
    try {
      await updateBranch(branch.id, { active: !branch.active });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cambiar el estado');
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
            <Building2 size={20} className="text-kiosko-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Sucursales</h1>
            <p className="text-sm text-surface-400">
              {branches.length} {branches.length === 1 ? 'sucursal' : 'sucursales'} registradas
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus size={16} />
          Nueva sucursal
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/40 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Card>
        <div className="flex items-center bg-surface-800 border border-surface-700 rounded-lg px-3 py-2">
          <Search size={16} className="text-surface-500 mr-2" />
          <input
            type="text"
            placeholder="Buscar sucursal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-white placeholder-surface-500 outline-none w-full"
          />
        </div>
      </Card>

      <Card padding={false}>
        {loading ? (
          <p className="text-sm text-surface-400 text-center py-10">Cargando...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <Building2 size={32} className="text-surface-600 mx-auto mb-3" />
            <p className="text-sm text-surface-400">
              {branches.length === 0
                ? 'Todavía no hay sucursales cargadas'
                : 'No se encontraron sucursales'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Sucursal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Dirección</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Estado</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((branch) => (
                  <tr key={branch.id} className="border-b border-surface-800/50 hover:bg-surface-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center shrink-0">
                          <Building2 size={14} className="text-kiosko-500" />
                        </div>
                        <span className="font-medium text-white">{branch.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-surface-300">
                      {branch.address ? (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-surface-500" />
                          {branch.address}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={branch.active ? 'success' : 'danger'}>
                        {branch.active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(branch)}
                          className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white"
                          title="Editar"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleToggle(branch)}
                          className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white"
                          title={branch.active ? 'Desactivar' : 'Activar'}
                        >
                          {branch.active ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <button
                          onClick={() => handleDelete(branch)}
                          className="p-1.5 rounded-lg hover:bg-red-900/30 text-surface-400 hover:text-red-400"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => {
              setShowForm(false);
              resetForm();
            }}
          />
          <div className="relative bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editing ? 'Editar sucursal' : 'Nueva sucursal'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-surface-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nombre *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Sucursal Centro"
                required
              />
              <Input
                label="Dirección"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Ej: Av. Principal 123"
              />
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" fullWidth disabled={saving}>
                  {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear sucursal'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

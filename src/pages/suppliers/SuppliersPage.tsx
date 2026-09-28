import { useEffect, useState } from 'react';
import { Truck, Plus, Search, Edit, Trash2, X, Phone, Mail, MapPin, Building2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { listSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../services/suppliers.service';
import type { Supplier } from '../../types';

const emptyForm = { name: '', company: '', phone: '', email: '', address: '', cuit: '', notes: '' };

export function SuppliersPage() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    let active = true;
    listSuppliers()
      .then((data) => {
        if (active) setSuppliers(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Error al cargar los proveedores');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = suppliers.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || (s.company ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('No hay una sesión activa');
      return;
    }
    try {
      if (editing) {
        await updateSupplier(editing.id, form);
        setSuppliers((prev) => prev.map((s) => (s.id === editing.id ? { ...s, ...form } : s)));
      } else {
        const created = await createSupplier(form, user.business_id);
        setSuppliers((prev) => [...prev, created]);
      }
      setShowForm(false);
      resetForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar el proveedor');
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) return;
    try {
      await deleteSupplier(supplier.id);
      setSuppliers((prev) => prev.filter((s) => s.id !== supplier.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el proveedor');
    }
  };

  const handleEdit = (sup: Supplier) => {
    setEditing(sup);
    setForm({
      name: sup.name,
      company: sup.company ?? '',
      phone: sup.phone ?? '',
      email: sup.email ?? '',
      address: sup.address ?? '',
      cuit: sup.cuit ?? '',
      notes: sup.notes ?? '',
    });
    setShowForm(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-kiosko-600/15 flex items-center justify-center">
            <Truck size={20} className="text-kiosko-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Proveedores</h1>
            <p className="text-sm text-surface-400">{suppliers.length} proveedores</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus size={16} /> Nuevo proveedor</Button>
      </div>

      <Card>
        <div className="flex items-center bg-surface-800 border border-surface-700 rounded-lg px-3 py-2">
          <Search size={16} className="text-surface-500 mr-2" />
          <input type="text" placeholder="Buscar proveedor..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm text-white placeholder-surface-500 outline-none w-full" />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && <p className="col-span-full text-center text-sm text-surface-400 py-8">Cargando...</p>}
        {!loading && error && <p className="col-span-full text-center text-sm text-red-400 py-8">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="col-span-full text-center text-sm text-surface-400 py-8">No hay proveedores registrados</p>
        )}
        {!loading && !error && filtered.map((sup) => (
          <Card key={sup.id} className="hover:border-kiosko-600/30 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center">
                  <Building2 size={16} className="text-surface-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{sup.name}</h3>
                  <p className="text-xs text-surface-500">{sup.company}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(sup)} className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white"><Edit size={14} /></button>
                <button onClick={() => handleDelete(sup)} className="p-1.5 rounded-lg hover:bg-red-900/30 text-surface-400 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-surface-400">
              {sup.phone && <div className="flex items-center gap-2"><Phone size={12} />{sup.phone}</div>}
              {sup.email && <div className="flex items-center gap-2"><Mail size={12} />{sup.email}</div>}
              {sup.address && <div className="flex items-center gap-2"><MapPin size={12} />{sup.address}</div>}
            </div>
            {sup.notes && <p className="mt-2 text-xs text-surface-500 italic">{sup.notes}</p>}
          </Card>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => { setShowForm(false); resetForm(); }} />
          <div className="relative bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{editing ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-surface-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input label="Empresa" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Input label="CUIT" value={form.cuit} onChange={(e) => setForm({ ...form, cuit: e.target.value })} />
                <Input label="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <Input label="Observaciones" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" fullWidth onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button>
                <Button type="submit" fullWidth>{editing ? 'Guardar' : 'Crear'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

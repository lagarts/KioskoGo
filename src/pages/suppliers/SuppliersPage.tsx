import { useState } from 'react';
import { Truck, Plus, Search, Edit, Trash2, X, Phone, Mail, MapPin, Building2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface Supplier {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  cuit: string;
  notes: string;
}

const mockSuppliers: Supplier[] = [
  { id: '1', name: 'Distribuidora Norte', company: 'Distribuidora Norte S.A.', phone: '11-4444-1111', email: 'ventas@dnorte.com', address: 'Industrial 500', cuit: '30-70123456-9', notes: 'Bebidas y snacks' },
  { id: '2', name: 'Frigorífico Sur', company: 'Frigorífico Sur S.R.L.', phone: '11-4444-2222', email: 'info@fsur.com', address: 'Mercado Central', cuit: '30-70987654-3', notes: 'Carnes y fiambres' },
  { id: '3', name: 'Panadería Industrial', company: 'Panificadora Central', phone: '11-4444-3333', email: 'pedidos@pancentral.com', address: 'Av. La Plata 2000', cuit: '30-70555555-1', notes: 'Pan y pastelería' },
  { id: '4', name: 'Lácteos del Valle', company: 'Lácteos del Valle S.A.', phone: '11-4444-4444', email: 'ventas@lvalle.com', address: 'Granja 100', cuit: '30-70777777-7', notes: 'Leche, queso, manteca' },
];

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', address: '', cuit: '', notes: '' });

  const filtered = suppliers.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.company.toLowerCase().includes(search.toLowerCase()));

  const resetForm = () => { setForm({ name: '', company: '', phone: '', email: '', address: '', cuit: '', notes: '' }); setEditing(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      setSuppliers((prev) => prev.map((s) => s.id === editing.id ? { ...s, ...form } : s));
    } else {
      setSuppliers((prev) => [...prev, { id: String(Date.now()), ...form }]);
    }
    setShowForm(false);
    resetForm();
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
        {suppliers.map((sup) => (
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
                <button onClick={() => { setEditing(sup); setForm({ name: sup.name, company: sup.company, phone: sup.phone, email: sup.email, address: sup.address, cuit: sup.cuit, notes: sup.notes }); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white"><Edit size={14} /></button>
                <button onClick={() => setSuppliers((prev) => prev.filter((s) => s.id !== sup.id))} className="p-1.5 rounded-lg hover:bg-red-900/30 text-surface-400 hover:text-red-400"><Trash2 size={14} /></button>
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

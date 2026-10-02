import { useEffect, useState } from 'react';
import { Users, Plus, Search, Edit, Trash2, X, Phone, Mail, MapPin, Wallet } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { listCustomers, createCustomer, updateCustomer, deleteCustomer, payCustomerBalance } from '../../services/customers.service';
import type { Customer } from '../../types';

const emptyForm = { name: '', phone: '', email: '', dni: '', cuit: '', address: '', notes: '' };

export function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [paying, setPaying] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payingSaving, setPayingSaving] = useState(false);

  useEffect(() => {
    let active = true;
    listCustomers()
      .then((data) => {
        if (active) setCustomers(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Error al cargar los clientes');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.dni ?? '').includes(search) ||
      (c.phone ?? '').includes(search)
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
        await updateCustomer(editing.id, form);
        setCustomers((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...form } : c)));
      } else {
        const created = await createCustomer(form, user.business_id);
        setCustomers((prev) => [...prev, created]);
      }
      setShowForm(false);
      resetForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar el cliente');
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    try {
      await deleteCustomer(customer.id);
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el cliente');
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paying) return;
    const amount = parseFloat(payAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      alert('Ingresá un monto mayor a cero');
      return;
    }
    if (amount > Number(paying.balance)) {
      alert(`El monto no puede superar el saldo (${formatCurrency(Number(paying.balance))})`);
      return;
    }
    setPayingSaving(true);
    try {
      const newBalance = await payCustomerBalance(paying.id, amount);
      setCustomers((prev) =>
        prev.map((c) => (c.id === paying.id ? { ...c, balance: newBalance } : c))
      );
      setPaying(null);
      setPayAmount('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo registrar el cobro');
    } finally {
      setPayingSaving(false);
    }
  };

  const handleEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone ?? '',
      email: c.email ?? '',
      dni: c.dni ?? '',
      cuit: c.cuit ?? '',
      address: c.address ?? '',
      notes: c.notes ?? '',
    });
    setShowForm(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-kiosko-600/15 flex items-center justify-center">
            <Users size={20} className="text-kiosko-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Clientes</h1>
            <p className="text-sm text-surface-400">{customers.length} clientes</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={16} /> Nuevo cliente
        </Button>
      </div>

      <Card>
        <div className="flex items-center bg-surface-800 border border-surface-700 rounded-lg px-3 py-2">
          <Search size={16} className="text-surface-500 mr-2" />
          <input type="text" placeholder="Buscar por nombre, DNI o teléfono..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm text-white placeholder-surface-500 outline-none w-full" />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && <p className="col-span-full text-center text-sm text-surface-400 py-8">Cargando...</p>}
        {!loading && error && <p className="col-span-full text-center text-sm text-red-400 py-8">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="col-span-full text-center text-sm text-surface-400 py-8">No hay clientes registrados</p>
        )}
        {!loading && !error && filtered.map((customer) => (
          <Card key={customer.id} className="hover:border-kiosko-600/30 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-kiosko-600/20 flex items-center justify-center text-kiosko-500 font-bold text-sm">
                  {customer.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{customer.name}</h3>
                  {customer.dni && <p className="text-xs text-surface-500">DNI: {customer.dni}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(customer)} className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white"><Edit size={14} /></button>
                <button onClick={() => handleDelete(customer)} className="p-1.5 rounded-lg hover:bg-red-900/30 text-surface-400 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-surface-400">
              {customer.phone && <div className="flex items-center gap-2"><Phone size={12} />{customer.phone}</div>}
              {customer.email && <div className="flex items-center gap-2"><Mail size={12} />{customer.email}</div>}
              {customer.address && <div className="flex items-center gap-2"><MapPin size={12} />{customer.address}</div>}
            </div>
            {Number(customer.balance) !== 0 && (
              <div className="mt-3 pt-3 border-t border-surface-800 space-y-2">
                <Badge variant={Number(customer.balance) > 0 ? 'danger' : 'success'}>
                  {Number(customer.balance) > 0
                    ? `Debe: ${formatCurrency(Number(customer.balance))}`
                    : `A favor: ${formatCurrency(Number(customer.balance))}`}
                </Badge>
                {Number(customer.balance) > 0 && (
                  <button
                    onClick={() => {
                      setPaying(customer);
                      setPayAmount('');
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-medium transition-colors"
                  >
                    <Wallet size={13} />
                    Cobrar saldo
                  </button>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => { setShowForm(false); resetForm(); }} />
          <div className="relative bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{editing ? 'Editar cliente' : 'Nuevo cliente'}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-surface-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Input label="DNI" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} />
                <Input label="CUIT" value={form.cuit} onChange={(e) => setForm({ ...form, cuit: e.target.value })} />
              </div>
              <Input label="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              <Input label="Observaciones" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" fullWidth onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button>
                <Button type="submit" fullWidth>{editing ? 'Guardar' : 'Crear'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {paying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => {
              if (!payingSaving) setPaying(null);
            }}
          />
          <div className="relative bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Cobrar saldo</h2>
              <button
                onClick={() => setPaying(null)}
                className="text-surface-400 hover:text-white"
                disabled={payingSaving}
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-surface-800 border border-surface-700 rounded-lg p-3">
              <p className="text-sm font-medium text-white">{paying.name}</p>
              <p className="text-xs text-red-400 mt-0.5">
                Debe: {formatCurrency(Number(paying.balance))}
              </p>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <Input
                label="Monto a cobrar *"
                type="number"
                min="0.01"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="0"
                required
              />
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => setPaying(null)}
                  disabled={payingSaving}
                >
                  Cancelar
                </Button>
                <Button type="submit" fullWidth disabled={payingSaving}>
                  {payingSaving ? 'Registrando...' : 'Cobrar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

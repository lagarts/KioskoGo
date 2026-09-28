import { useEffect, useState } from 'react';
import { ReceiptIcon, Plus, Trash2, X, Calendar, DollarSign } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { formatCurrency, formatDate } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import { listExpenses, createExpense, deleteExpense } from '../../services/expenses.service';
import type { Expense } from '../../types';

const expenseCategories = ['Alquiler', 'Luz', 'Internet', 'Sueldos', 'Proveedores', 'Impuestos', 'Mantenimiento', 'Transporte', 'Otros'];

const emptyForm = { category: '', amount: '', description: '', date: '' };

const todayForm = () => ({ ...emptyForm, date: new Date().toISOString().split('T')[0] });

export function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(todayForm());

  useEffect(() => {
    let active = true;
    listExpenses()
      .then((data) => {
        if (active) setExpenses(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Error al cargar los gastos');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('No hay una sesión activa');
      return;
    }
    try {
      const created = await createExpense(
        {
          category: form.category,
          amount: parseFloat(form.amount) || 0,
          description: form.description,
          date: form.date,
        },
        user.id,
        user.business_id
      );
      setExpenses((prev) => [created, ...prev]);
      setShowForm(false);
      setForm(todayForm());
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al registrar el gasto');
    }
  };

  const handleDelete = async (expense: Expense) => {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return;
    try {
      await deleteExpense(expense.id);
      setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el gasto');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-kiosko-600/15 flex items-center justify-center">
            <ReceiptIcon size={20} className="text-kiosko-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Gastos</h1>
            <p className="text-sm text-surface-400">Total: {formatCurrency(totalExpenses)}</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus size={16} /> Nuevo gasto</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {expenseCategories.slice(0, 4).map((cat) => {
          const catTotal = expenses.filter((e) => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
          return (
            <Card key={cat}>
              <p className="text-xs text-surface-400">{cat}</p>
              <p className="text-lg font-bold text-white mt-1">{formatCurrency(catTotal)}</p>
            </Card>
          );
        })}
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Fecha</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Categoría</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Descripción</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Monto</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-surface-400">Cargando...</td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-red-400">{error}</td>
                </tr>
              )}
              {!loading && !error && expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-surface-400">Sin gastos registrados</td>
                </tr>
              )}
              {!loading && !error && expenses.map((exp) => (
                <tr key={exp.id} className="border-b border-surface-800/50 hover:bg-surface-800/30">
                  <td className="px-4 py-3 text-surface-300">{formatDate(exp.date)}</td>
                  <td className="px-4 py-3"><Badge>{exp.category}</Badge></td>
                  <td className="px-4 py-3 text-white">{exp.description}</td>
                  <td className="px-4 py-3 text-right font-semibold text-red-400">-{formatCurrency(exp.amount)}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleDelete(exp)} className="p-1.5 rounded-lg hover:bg-red-900/30 text-surface-400 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowForm(false)} />
          <div className="relative bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Nuevo gasto</h2>
              <button onClick={() => setShowForm(false)} className="text-surface-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Categoría *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-2.5 text-white outline-none" required>
                  <option value="">Seleccionar...</option>
                  {expenseCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Input label="Monto ($)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} icon={<DollarSign size={16} />} required />
              <Input label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Input label="Fecha" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} icon={<Calendar size={16} />} />
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" fullWidth onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" fullWidth>Registrar gasto</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

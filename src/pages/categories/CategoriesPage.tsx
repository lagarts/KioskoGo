import { useEffect, useState } from 'react';
import { Tag, Plus, Edit, Trash2, X } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryWithCount,
} from '../../services/categories.service';

export function CategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: '🏷️', color: '#FFCA28' });

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
        });
      } else {
        await createCategory(
          { name: formData.name, icon: formData.icon, color: formData.color },
          user!.business_id
        );
      }
      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '', icon: '🏷️', color: '#FFCA28' });
      await loadCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar la categoría');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría?')) return;
    try {
      await deleteCategory(id);
      await loadCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar la categoría');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-kiosko-600/15 flex items-center justify-center">
            <Tag size={20} className="text-kiosko-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Categorías</h1>
            <p className="text-sm text-surface-400">{categories.length} categorías</p>
          </div>
        </div>
        <Button onClick={() => { setEditingCategory(null); setFormData({ name: '', icon: '🏷️', color: '#FFCA28' }); setShowForm(true); }}>
          <Plus size={16} /> Nueva categoría
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/40 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-sm text-surface-400">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Card key={cat.id} className="hover:border-kiosko-600/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: (cat.color ?? '#FFCA28') + '20' }}>
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{cat.name}</h3>
                    <p className="text-xs text-surface-400">{cat.productCount} productos</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingCategory(cat); setFormData({ name: cat.name, icon: cat.icon ?? '', color: cat.color ?? '#FFCA28' }); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg hover:bg-red-900/30 text-surface-400 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowForm(false)} />
          <div className="relative bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{editingCategory ? 'Editar categoría' : 'Nueva categoría'}</h2>
              <button onClick={() => setShowForm(false)} className="text-surface-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Nombre *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <Input label="Icono (emoji)" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} />
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
                  <Input value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="flex-1" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" fullWidth onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" fullWidth>{editingCategory ? 'Guardar' : 'Crear'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

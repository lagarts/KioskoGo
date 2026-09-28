import { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Copy,
  X,
  Filter,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type ProductInput,
  type ProductWithCategory,
} from '../../services/products.service';
import { listCategories, type CategoryWithCount } from '../../services/categories.service';
import type { UnitType } from '../../types';

type UnitFormValue = 'uds' | 'kg' | 'g' | 'l' | 'ml' | 'm';

function toFormUnit(unit: UnitType): UnitFormValue {
  return unit === 'unit' ? 'uds' : unit;
}

function toUnitType(unit: UnitFormValue): UnitType {
  return unit === 'uds' ? 'unit' : unit;
}

export function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    category: '',
    cost: '',
    price: '',
    stock: '',
    minStock: '',
    unit: 'uds' as UnitFormValue,
    tax: '21',
  });

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prods, cats] = await Promise.all([listProducts(), listCategories()]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = products.filter((p) => {
    const term = search.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(term) ||
      (p.sku ?? '').toLowerCase().includes(term) ||
      (p.barcode ?? '').includes(search);
    const matchCat = filterCategory === 'all' || p.category_id === filterCategory;
    return matchSearch && matchCat;
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', sku: '', barcode: '', category: '', cost: '', price: '', stock: '', minStock: '', unit: 'uds', tax: '21' });
    setEditingProduct(null);
  };

  const buildInput = (): ProductInput => ({
    name: formData.name,
    description: formData.description,
    sku: formData.sku,
    barcode: formData.barcode,
    category_id: formData.category || null,
    cost: parseFloat(formData.cost) || 0,
    price: parseFloat(formData.price) || 0,
    stock: parseFloat(formData.stock) || 0,
    min_stock: parseFloat(formData.minStock) || 0,
    unit: toUnitType(formData.unit),
    tax: parseFloat(formData.tax) || 21,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, buildInput());
      } else {
        await createProduct(buildInput(), user!.business_id);
      }
      setShowForm(false);
      resetForm();
      await loadProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar el producto');
    }
  };

  const handleEdit = (product: ProductWithCategory) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      category: product.category_id || '',
      cost: String(product.cost),
      price: String(product.price),
      stock: String(product.stock),
      minStock: String(product.min_stock),
      unit: toFormUnit(product.unit),
      tax: String(product.tax),
    });
    setShowForm(true);
  };

  const handleDuplicate = async (product: ProductWithCategory) => {
    try {
      await createProduct(
        {
          name: product.name + ' (Copia)',
          description: product.description,
          sku: product.sku ? product.sku + '-COPY' : '',
          barcode: '',
          category_id: product.category_id ?? null,
          cost: product.cost,
          price: product.price,
          stock: product.stock,
          min_stock: product.min_stock,
          unit: product.unit,
          tax: product.tax,
        },
        user!.business_id
      );
      await loadProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al duplicar el producto');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await deleteProduct(id);
      await loadProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el producto');
    }
  };

  const handleToggleActive = async (product: ProductWithCategory) => {
    try {
      await updateProduct(product.id, { active: !product.active });
      await loadProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cambiar el estado del producto');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-kiosko-600/15 flex items-center justify-center">
            <Package size={20} className="text-kiosko-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Productos</h1>
            <p className="text-sm text-surface-400">{products.length} productos registrados</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={16} />
          Nuevo producto
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/40 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center bg-surface-800 border border-surface-700 rounded-lg px-3 py-2">
            <Search size={16} className="text-surface-500 mr-2" />
            <input
              type="text"
              placeholder="Buscar por nombre, SKU o código de barras..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-white placeholder-surface-500 outline-none w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-surface-500" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white outline-none"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Producto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase hidden md:table-cell">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-400 uppercase hidden lg:table-cell">Categoría</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Costo</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Precio</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Stock</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Estado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-surface-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-surface-400">Cargando...</td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-surface-400">No hay productos cargados</td>
                </tr>
              )}
              {!loading && filtered.map((product) => (
                <tr key={product.id} className="border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center shrink-0">
                        <Package size={14} className="text-surface-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">{product.name}</p>
                        <p className="text-xs text-surface-500 truncate">{product.barcode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-surface-300 hidden md:table-cell">{product.sku}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <Badge>{product.categories?.name ?? '—'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-surface-300">{formatCurrency(product.cost)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-kiosko-500">{formatCurrency(product.price)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-medium ${product.stock <= product.min_stock ? 'text-red-400' : 'text-green-400'}`}>
                      {product.stock} {toFormUnit(product.unit)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={product.active ? 'success' : 'danger'}>
                      {product.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEdit(product)} className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white" title="Editar">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDuplicate(product)} className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white" title="Duplicar">
                        <Copy size={14} />
                      </button>
                      <button onClick={() => handleToggleActive(product)} className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white" title={product.active ? 'Desactivar' : 'Activar'}>
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded-lg hover:bg-red-900/30 text-surface-400 hover:text-red-400" title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => { setShowForm(false); resetForm(); }} />
          <div className="relative bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{editingProduct ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-surface-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nombre *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                <Input label="Descripción" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                <Input label="SKU" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
                <Input label="Código de barras" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} />
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">Categoría *</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-2.5 text-white outline-none" required>
                    <option value="">Seleccionar...</option>
                    {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">Unidad de venta</label>
                  <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value as UnitFormValue })} className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-2.5 text-white outline-none">
                    <option value="uds">Unidad</option>
                    <option value="kg">Kilogramo</option>
                    <option value="g">Gramos</option>
                    <option value="l">Litro</option>
                    <option value="ml">Mililitro</option>
                    <option value="m">Metro</option>
                  </select>
                </div>
                <Input label="Costo ($)" type="number" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} />
                <Input label="Precio de venta ($)" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                <Input label="Stock actual" type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
                <Input label="Stock mínimo" type="number" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: e.target.value })} />
                <Input label="IVA (%)" type="number" value={formData.tax} onChange={(e) => setFormData({ ...formData, tax: e.target.value })} />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="secondary" fullWidth onClick={() => { setShowForm(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button type="submit" fullWidth>
                  {editingProduct ? 'Guardar cambios' : 'Crear producto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

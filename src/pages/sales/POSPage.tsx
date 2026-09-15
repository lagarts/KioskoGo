import { useState, useRef, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  X,
  Calculator,
  CreditCard,
  Banknote,
  Smartphone,
  Check,
} from 'lucide-react';
import { Package } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/format';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

const categories = [
  { id: 'all', name: 'Todos', icon: '🏷️' },
  { id: 'bebidas', name: 'Bebidas', icon: '🥤' },
  { id: 'golosinas', name: 'Golosinas', icon: '🍬' },
  { id: 'almacen', name: 'Almacén', icon: '🏪' },
  { id: 'lacteos', name: 'Lácteos', icon: '🥛' },
  { id: 'panaderia', name: 'Panadería', icon: '🍞' },
  { id: 'carniceria', name: 'Carnicería', icon: '🥩' },
  { id: 'limpieza', name: 'Limpieza', icon: '🧹' },
  { id: 'dietetica', name: 'Dietética', icon: '🥗' },
  { id: 'frescos', name: 'Frescos', icon: '🍎' },
];

const mockProducts = [
  { id: '1', name: 'Coca Cola 500ml', price: 2500, category: 'bebidas', stock: 24, barcode: '77900001' },
  { id: '2', name: 'Pepsi 500ml', price: 2300, category: 'bebidas', stock: 18, barcode: '77900002' },
  { id: '3', name: 'Agua Mineral 500ml', price: 1200, category: 'bebidas', stock: 30, barcode: '77900003' },
  { id: '4', name: 'Alfajor Havanna', price: 1200, category: 'golosinas', stock: 15, barcode: '77900004' },
  { id: '5', name: 'Galletitas Oreo', price: 1800, category: 'golosinas', stock: 12, barcode: '77900005' },
  { id: '6', name: 'Chocolate Milka', price: 2200, category: 'golosinas', stock: 8, barcode: '77900006' },
  { id: '7', name: 'Yerba Mate 1kg', price: 2000, category: 'almacen', stock: 20, barcode: '77900007' },
  { id: '8', name: 'Azúcar 1kg', price: 1500, category: 'almacen', stock: 25, barcode: '77900008' },
  { id: '9', name: 'Harina 1kg', price: 1100, category: 'almacen', stock: 22, barcode: '77900009' },
  { id: '10', name: 'Leche La Serenísima', price: 1500, category: 'lacteos', stock: 16, barcode: '77900010' },
  { id: '11', name: 'Queso Cremoso /kg', price: 9500, category: 'lacteos', stock: 5, barcode: '77900011', unit: 'kg' },
  { id: '12', name: 'Pan Francés', price: 1500, category: 'panaderia', stock: 30, barcode: '77900012' },
  { id: '13', name: 'Medialunas x6', price: 3500, category: 'panaderia', stock: 10, barcode: '77900013' },
  { id: '14', name: 'Carne /kg', price: 9500, category: 'carniceria', stock: 8, barcode: '77900014', unit: 'kg' },
  { id: '15', name: 'Pollo Entero /kg', price: 5800, category: 'carniceria', stock: 10, barcode: '77900015', unit: 'kg' },
  { id: '16', name: 'Detergente', price: 2800, category: 'limpieza', stock: 14, barcode: '77900016' },
  { id: '17', name: 'Jabón en Barra', price: 900, category: 'limpieza', stock: 20, barcode: '77900017' },
  { id: '18', name: 'Avena 500g', price: 1300, category: 'dietetica', stock: 12, barcode: '77900018' },
  { id: '19', name: 'Miel 500ml', price: 3200, category: 'dietetica', stock: 6, barcode: '77900019' },
  { id: '20', name: 'Manzanas /kg', price: 3500, category: 'frescos', stock: 15, barcode: '77900020', unit: 'kg' },
];

const paymentMethods = [
  { id: 'cash', label: 'Efectivo', icon: <Banknote size={18} /> },
  { id: 'debit', label: 'Tarjeta Débito', icon: <CreditCard size={18} /> },
  { id: 'credit', label: 'Tarjeta Crédito', icon: <CreditCard size={18} /> },
  { id: 'transfer', label: 'Transferencia', icon: <Smartphone size={18} /> },
  { id: 'mercadopago', label: 'Mercado Pago', icon: <Smartphone size={18} /> },
];

export function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [saleComplete, setSaleComplete] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredProducts = mockProducts.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search);
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (product: typeof mockProducts[0]) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, unit: product.unit || 'uds' }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0);
    });
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSale = () => {
    setSaleComplete(true);
    setTimeout(() => {
      setSaleComplete(false);
      setCart([]);
      setShowPayment(false);
      setSelectedPayment('cash');
      setAmountPaid('');
    }, 2000);
  };

  const change = amountPaid ? Math.max(0, parseFloat(amountPaid) - cartTotal) : 0;

  // Keyboard barcode listener
  useEffect(() => {
    let barcodeBuffer = '';
    let timeout: ReturnType<typeof setTimeout>;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === searchRef.current) return;

      if (e.key === 'Enter' && barcodeBuffer.length > 0) {
        const product = mockProducts.find((p) => p.barcode === barcodeBuffer);
        if (product) {
          addToCart(product);
        }
        barcodeBuffer = '';
        return;
      }

      if (e.key.length === 1) {
        barcodeBuffer += e.key;
        clearTimeout(timeout);
        timeout = setTimeout(() => { barcodeBuffer = ''; }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowPayment(false);
        setSaleComplete(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (saleComplete) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Check size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">¡Venta completada!</h2>
          <p className="text-surface-400">Total: {formatCurrency(cartTotal)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-6rem)]">
      {/* Left: Cart */}
      <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col">
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-4 border-b border-surface-800">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} className="text-kiosko-500" />
              <h2 className="text-lg font-semibold text-white">Carrito</h2>
              {cart.length > 0 && (
                <Badge variant="info">{cartItems}</Badge>
              )}
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Vaciar
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-surface-500">
                <ShoppingCart size={40} className="mb-3 opacity-50" />
                <p className="text-sm">Carrito vacío</p>
                <p className="text-xs mt-1">Escanear o seleccionar productos</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-surface-800/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.name}</p>
                    <p className="text-xs text-surface-400">{formatCurrency(item.price)} / {item.unit}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 rounded-md bg-surface-700 hover:bg-surface-600 flex items-center justify-center text-white"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 rounded-md bg-surface-700 hover:bg-surface-600 flex items-center justify-center text-white"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-kiosko-500 w-20 text-right">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-surface-500 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="border-t border-surface-800 pt-3 space-y-3">
              <div className="flex items-center justify-between text-lg font-bold">
                <span className="text-white">Total</span>
                <span className="text-kiosko-500">{formatCurrency(cartTotal)}</span>
              </div>
              <Button fullWidth size="lg" onClick={() => setShowPayment(true)}>
                <CreditCard size={18} />
                Cobrar
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Right: Products */}
      <div className="flex-1 flex flex-col min-w-0">
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-3 pb-4 border-b border-surface-800">
            <div className="flex-1 flex items-center bg-surface-800 border border-surface-700 rounded-lg px-3 py-2">
              <Search size={16} className="text-surface-500 mr-2" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Buscar producto o escanear código... (F1)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm text-white placeholder-surface-500 outline-none w-full"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-surface-500 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="hidden md:flex items-center gap-1 text-xs text-surface-500">
              <Calculator size={14} />
              <span>F1 buscar</span>
              <span>·</span>
              <span>ESC cancelar</span>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 py-3 overflow-x-auto no-scrollbar border-b border-surface-800">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors
                  ${selectedCategory === cat.id
                    ? 'bg-kiosko-600 text-black'
                    : 'bg-surface-800 text-surface-300 hover:bg-surface-700'
                  }
                `}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto py-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="flex flex-col items-center p-3 rounded-xl bg-surface-800/50 border border-surface-700/50 hover:border-kiosko-600/50 hover:bg-surface-800 transition-all text-left group"
                >
                  <div className="w-full aspect-square rounded-lg bg-surface-700/50 flex items-center justify-center mb-2 group-hover:bg-surface-700 transition-colors">
                    <Package size={24} className="text-surface-500" />
                  </div>
                  <p className="text-xs font-medium text-white text-center line-clamp-2 w-full">{product.name}</p>
                  <p className="text-sm font-bold text-kiosko-500 mt-1">{formatCurrency(product.price)}</p>
                  {product.unit && (
                    <span className="text-[10px] text-surface-500">por {product.unit}</span>
                  )}
                  <span className="text-[10px] text-surface-600 mt-0.5">Stock: {product.stock}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowPayment(false)} />
          <div className="relative bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Cobrar</h2>
              <button onClick={() => setShowPayment(false)} className="text-surface-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="text-center py-4">
              <p className="text-sm text-surface-400">Total a cobrar</p>
              <p className="text-4xl font-bold text-kiosko-500">{formatCurrency(cartTotal)}</p>
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`
                    flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors
                    ${selectedPayment === method.id
                      ? 'border-kiosko-600 bg-kiosko-600/10 text-kiosko-500'
                      : 'border-surface-700 bg-surface-800 text-surface-300 hover:border-surface-600'
                    }
                  `}
                >
                  {method.icon}
                  <span className="text-[10px] font-medium">{method.label}</span>
                </button>
              ))}
            </div>

            {selectedPayment === 'cash' && (
              <div>
                <label className="block text-sm text-surface-400 mb-1">Monto recibido</label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0"
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-3 text-2xl font-bold text-white text-center focus:outline-none focus:ring-2 focus:ring-kiosko-500/50"
                />
                {amountPaid && parseFloat(amountPaid) >= cartTotal && (
                  <p className="text-center text-green-400 text-sm mt-2">
                    Vuelto: {formatCurrency(change)}
                  </p>
                )}
              </div>
            )}

            <Button fullWidth size="xl" onClick={handleSale}>
              <Check size={20} />
              Confirmar venta
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

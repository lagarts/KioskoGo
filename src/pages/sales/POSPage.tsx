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
  Users,
  Check,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CalculatorModal } from '../../components/ui/CalculatorModal';
import { formatCurrency } from '../../utils/format';
import { listProducts, type ProductWithCategory } from '../../services/products.service';
import { listCategories, type CategoryWithCount } from '../../services/categories.service';
import { listCustomers } from '../../services/customers.service';
import { getOpenRegister } from '../../services/cash.service';
import { recordSale, type SaleItemInput } from '../../services/sales.service';
import type { CashRegister, Customer, PaymentMethod } from '../../types';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

const paymentMethods: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { id: 'cash', label: 'Efectivo', icon: <Banknote size={18} /> },
  { id: 'debit', label: 'Tarjeta Débito', icon: <CreditCard size={18} /> },
  { id: 'credit', label: 'Tarjeta Crédito', icon: <CreditCard size={18} /> },
  { id: 'transfer', label: 'Transferencia', icon: <Smartphone size={18} /> },
  { id: 'mercadopago', label: 'Mercado Pago', icon: <Smartphone size={18} /> },
  { id: 'account', label: 'Cuenta Corriente', icon: <Users size={18} /> },
];

function unitLabel(unit: string): string {
  if (unit === 'unit') return 'uds';
  return unit;
}

export function POSPage() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [register, setRegister] = useState<CashRegister | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPayment, setShowPayment] = useState(false);
  const [calcMode, setCalcMode] = useState<'basic' | 'amount' | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [accountPaid, setAccountPaid] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [saving, setSaving] = useState(false);
  const [saleComplete, setSaleComplete] = useState(false);
  const [lastSaleNumber, setLastSaleNumber] = useState<number | null>(null);
  const [lastSaleTotal, setLastSaleTotal] = useState(0);
  const [lastSaleCustomerName, setLastSaleCustomerName] = useState('');
  const [lastSalePaid, setLastSalePaid] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const productsRef = useRef<ProductWithCategory[]>([]);
  const calcOpenRef = useRef(false);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    calcOpenRef.current = calcMode !== null;
  }, [calcMode]);

  const loadAll = async () => {
    try {
      setLoadError('');
      const [prods, cats, custs, openRegister] = await Promise.all([
        listProducts(),
        listCategories(),
        listCustomers(),
        getOpenRegister(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setCustomers(custs);
      setRegister(openRegister);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const activeProducts = products.filter((p) => p.active);

  const filteredProducts = activeProducts.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode ?? '').includes(search);
    const matchCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    return matchSearch && matchCategory;
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? null;
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.dni ?? '').includes(customerSearch) ||
      (c.phone ?? '').includes(customerSearch)
  );
  const accountPaidAmount =
    selectedPayment === 'account' && accountPaid.trim() !== ''
      ? Math.max(0, parseFloat(accountPaid) || 0)
      : 0;
  const chargedToAccount = cartTotal - accountPaidAmount;

  const addToCart = (product: ProductWithCategory) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          quantity: 1,
          unit: unitLabel(product.unit),
        },
      ];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSale = async () => {
    if (cart.length === 0 || saving) return;
    if (selectedPayment === 'cash' && !register) return;
    if (selectedPayment === 'account' && !selectedCustomer) {
      alert('Elegí un cliente para cargar la venta a cuenta corriente');
      return;
    }

    setSaving(true);
    try {
      const items: SaleItemInput[] = cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total: item.price * item.quantity,
      }));
      const sale = await recordSale({
        cash_register_id: register?.id ?? null,
        customer_id: selectedPayment === 'account' ? selectedCustomer!.id : null,
        payment_method: selectedPayment,
        subtotal: cartTotal,
        discount: 0,
        tax: 0,
        total: cartTotal,
        amount_paid: selectedPayment === 'account' ? accountPaidAmount : 0,
        items,
      });
      setLastSaleNumber(sale.number);
      setLastSaleTotal(cartTotal);
      setLastSaleCustomerName(
        selectedPayment === 'account' && selectedCustomer ? selectedCustomer.name : ''
      );
      setLastSalePaid(selectedPayment === 'account' ? accountPaidAmount : 0);
      setSaleComplete(true);
      setCart([]);
      setShowPayment(false);
      setSelectedPayment('cash');
      setSelectedCustomerId(null);
      setCustomerSearch('');
      setAccountPaid('');
      setAmountPaid('');
      const [prods, custs] = await Promise.all([listProducts(), listCustomers()]);
      setProducts(prods);
      setCustomers(custs);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo registrar la venta');
    } finally {
      setSaving(false);
    }
  };

  const resetSale = () => {
    setSaleComplete(false);
    setLastSaleNumber(null);
    setLastSaleTotal(0);
    setLastSaleCustomerName('');
    setLastSalePaid(0);
  };

  const change = amountPaid ? Math.max(0, parseFloat(amountPaid) - cartTotal) : 0;

  useEffect(() => {
    let barcodeBuffer = '';
    let timeout: ReturnType<typeof setTimeout>;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === searchRef.current || calcOpenRef.current) return;

      if (e.key === 'Enter' && barcodeBuffer.length > 0) {
        const product = productsRef.current.find(
          (p) => p.barcode === barcodeBuffer && p.active
        );
        if (product) {
          addToCart(product);
        }
        barcodeBuffer = '';
        return;
      }

      if (e.key.length === 1) {
        barcodeBuffer += e.key;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          barcodeBuffer = '';
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowPayment(false);
        setSaleComplete(false);
        setCalcMode(null);
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
          {lastSaleNumber !== null && (
            <p className="text-surface-400 mb-1">Venta #{lastSaleNumber}</p>
          )}
          <p className="text-surface-400 mb-1">Total: {formatCurrency(lastSaleTotal)}</p>
          {lastSaleCustomerName && (
            <p className="text-yellow-400 text-sm mb-1">
              Cargado a cuenta corriente de {lastSaleCustomerName}
            </p>
          )}
          {lastSalePaid > 0 && (
            <p className="text-green-400 text-sm mb-6">
              Abonó {formatCurrency(lastSalePaid)} en el momento
            </p>
          )}
          <Button
            size="lg"
            onClick={resetSale}
            className={lastSaleCustomerName || lastSalePaid > 0 ? '' : 'mt-6'}
          >
            <Plus size={18} />
            Nueva venta
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-kiosko-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-surface-400 text-sm">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-6rem)]">
      {/* Left: Cart */}
      <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-surface-800">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} className="text-kiosko-500" />
              <h2 className="text-lg font-semibold text-white">Carrito</h2>
              {cart.length > 0 && <Badge variant="info">{cartItems}</Badge>}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCalcMode('basic')}
                className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-kiosko-500 transition-colors"
                title="Abrir calculadora"
              >
                <Calculator size={15} />
                <span className="hidden sm:inline">Calculadora</span>
              </button>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Vaciar
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-surface-500">
                <ShoppingCart size={40} className="mb-3 opacity-50" />
                <p className="text-sm">Carrito vacío</p>
                <p className="text-xs mt-1">Escanear o seleccionar productos</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-surface-800/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.name}</p>
                    <p className="text-xs text-surface-400">
                      {formatCurrency(item.price)} / {item.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 rounded-md bg-surface-700 hover:bg-surface-600 flex items-center justify-center text-white"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-white">
                      {item.quantity}
                    </span>
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
                <button
                  onClick={() => setSearch('')}
                  className="text-surface-500 hover:text-white"
                >
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

          <div className="flex gap-2 py-3 overflow-x-auto no-scrollbar border-b border-surface-800">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors
                ${
                  selectedCategory === 'all'
                    ? 'bg-kiosko-600 text-black'
                    : 'bg-surface-800 text-surface-300 hover:bg-surface-700'
                }
              `}
            >
              <span>🏷️</span>
              <span>Todos</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors
                  ${
                    selectedCategory === cat.id
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

          <div className="flex-1 overflow-y-auto py-3">
            {loadError && (
              <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg mb-3">
                {loadError}
              </div>
            )}
            {!loadError && filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-surface-500">
                <Package size={40} className="mb-3 opacity-50" />
                <p className="text-sm">
                  {activeProducts.length === 0
                    ? 'No hay productos cargados. Cargá productos para empezar a vender.'
                    : 'No se encontraron productos'}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="flex flex-col items-center p-3 rounded-xl bg-surface-800/50 border border-surface-700/50 hover:border-kiosko-600/50 hover:bg-surface-800 transition-all text-left group"
                >
                  <div className="w-full aspect-square rounded-lg bg-surface-700/50 flex items-center justify-center mb-2 overflow-hidden group-hover:bg-surface-700 transition-colors">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Package size={24} className="text-surface-500" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-white text-center line-clamp-2 w-full">
                    {product.name}
                  </p>
                  <p className="text-sm font-bold text-kiosko-500 mt-1">
                    {formatCurrency(Number(product.price))}
                  </p>
                  <span className="text-[10px] text-surface-600 mt-0.5">
                    Stock: {Number(product.stock)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => !saving && setShowPayment(false)}
          />
          <div className="relative bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Cobrar</h2>
              <button
                onClick={() => setShowPayment(false)}
                className="text-surface-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="text-center py-4">
              <p className="text-sm text-surface-400">Total a cobrar</p>
              <p className="text-4xl font-bold text-kiosko-500">
                {formatCurrency(cartTotal)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`
                    flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors
                    ${
                      selectedPayment === method.id
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

            {selectedPayment === 'account' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-surface-400">Cliente (obligatorio)</label>
                  {selectedCustomer && (
                    <button
                      onClick={() => {
                        setSelectedCustomerId(null);
                        setCustomerSearch('');
                        setAccountPaid('');
                      }}
                      className="text-xs text-kiosko-500 hover:text-kiosko-400"
                    >
                      Cambiar cliente
                    </button>
                  )}
                </div>

                {selectedCustomer ? (
                  <div className="bg-surface-800 border border-kiosko-600/50 rounded-lg p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {selectedCustomer.name}
                      </p>
                      <p className="text-xs text-surface-400">
                        {Number(selectedCustomer.balance) > 0
                          ? `Saldo actual: ${formatCurrency(Number(selectedCustomer.balance))}`
                          : 'Sin saldo pendiente'}
                      </p>
                    </div>
                    <Users size={18} className="text-kiosko-500 shrink-0" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 mb-2">
                      <Search size={14} className="text-surface-500 mr-2" />
                      <input
                        type="text"
                        placeholder="Buscar cliente por nombre, DNI o teléfono..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="bg-transparent text-sm text-white placeholder-surface-500 outline-none w-full"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {filteredCustomers.length === 0 && (
                        <p className="text-xs text-surface-500 text-center py-3">
                          No hay clientes cargados. Creá el cliente en la sección Clientes.
                        </p>
                      )}
                      {filteredCustomers.slice(0, 20).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCustomerId(c.id)}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 hover:border-kiosko-600/50 text-left transition-colors"
                        >
                          <span className="text-sm text-white truncate">{c.name}</span>
                          {Number(c.balance) > 0 && (
                            <span className="text-[10px] text-yellow-400 shrink-0">
                              {formatCurrency(Number(c.balance))}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {selectedCustomer && (
                  <div className="mt-3">
                    <label className="block text-sm text-surface-400 mb-1">
                      Abona ahora (opcional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={accountPaid}
                      onChange={(e) => setAccountPaid(e.target.value)}
                      placeholder="0"
                      className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-kiosko-500/50"
                    />
                    {accountPaidAmount > 0 && (
                      <div className="mt-2 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-surface-400">Cobro en el momento</span>
                          <span className="text-green-400 font-medium">
                            {formatCurrency(accountPaidAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-surface-400">
                            {chargedToAccount >= 0 ? 'Se carga a cuenta' : 'Aplica a deuda anterior'}
                          </span>
                          <span
                            className={
                              chargedToAccount >= 0 ? 'text-yellow-400 font-medium' : 'text-sky-400 font-medium'
                            }
                          >
                            {formatCurrency(chargedToAccount)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-surface-800 pt-1">
                          <span className="text-surface-400">Nuevo saldo del cliente</span>
                          <span className="text-white font-medium">
                            {formatCurrency(Number(selectedCustomer.balance) + chargedToAccount)}
                          </span>
                        </div>
                      </div>
                    )}
                    {accountPaidAmount > 0 && !register && (
                      <div className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-800 rounded-lg p-2 mt-2">
                        <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-400">
                          No hay caja abierta: el abono no quedará registrado en movimientos de caja.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-surface-500 mt-2">
                  {accountPaidAmount > 0
                    ? 'El saldo se actualiza con la diferencia y se cobra más tarde desde Clientes.'
                    : 'El total se suma al saldo del cliente y se cobra más tarde desde Clientes.'}
                </p>
              </div>
            )}

            {selectedPayment === 'cash' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-surface-400">Monto recibido</label>
                  <button
                    onClick={() => setCalcMode('amount')}
                    className="flex items-center gap-1 text-xs text-surface-400 hover:text-kiosko-500 transition-colors"
                  >
                    <Calculator size={12} />
                    Calculadora
                  </button>
                </div>
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

            {selectedPayment === 'cash' && !register && (
              <div className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-800 rounded-lg p-3">
                <AlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-400">
                  No hay caja abierta. Abrí la caja en la sección Caja para cobrar en efectivo.
                </p>
              </div>
            )}

            <Button
              fullWidth
              size="xl"
              onClick={handleSale}
              disabled={
                saving ||
                cart.length === 0 ||
                (selectedPayment === 'cash' && !register) ||
                (selectedPayment === 'account' && !selectedCustomer)
              }
            >
              {saving ? 'Registrando...' : <><Check size={20} /> Confirmar venta</>}
            </Button>
          </div>
        </div>
      )}

      <CalculatorModal
        open={calcMode !== null}
        onClose={() => setCalcMode(null)}
        onUse={
          calcMode === 'amount'
            ? (value) => setAmountPaid(value)
            : undefined
        }
      />
    </div>
  );
}

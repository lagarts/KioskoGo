-- ============================================
-- KioskoGo - Schema de Base de Datos
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- BUSINESSES (Comercios)
-- ============================================
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  rubro TEXT NOT NULL DEFAULT 'otro',
  phone TEXT,
  address TEXT,
  email TEXT,
  logo TEXT,
  cuit TEXT,
  region TEXT DEFAULT 'es-AR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROFILES (Usuarios)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'cajero' CHECK (role IN ('admin', 'encargado', 'cajero')),
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CATEGORIES (Categorías)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🏷️',
  color TEXT DEFAULT '#FFCA28',
  parent_id UUID REFERENCES categories(id),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BRANDS (Marcas)
-- ============================================
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUPPLIERS (Proveedores)
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  cuit TEXT,
  notes TEXT,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CUSTOMERS (Clientes)
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  dni TEXT,
  cuit TEXT,
  address TEXT,
  notes TEXT,
  balance NUMERIC(12,2) DEFAULT 0,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCTS (Productos)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  barcode TEXT,
  category_id UUID REFERENCES categories(id),
  brand_id UUID REFERENCES brands(id),
  supplier_id UUID REFERENCES suppliers(id),
  cost NUMERIC(12,2) DEFAULT 0,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock NUMERIC(12,2) DEFAULT 0,
  min_stock NUMERIC(12,2) DEFAULT 0,
  unit TEXT DEFAULT 'unit' CHECK (unit IN ('unit', 'kg', 'g', 'l', 'ml', 'm')),
  tax NUMERIC(5,2) DEFAULT 21,
  image TEXT,
  active BOOLEAN DEFAULT true,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCT_VARIANTES (Variantes)
-- ============================================
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  stock NUMERIC(12,2) DEFAULT 0,
  price NUMERIC(12,2) DEFAULT 0,
  cost NUMERIC(12,2) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WAREHOUSES (Depósitos)
-- ============================================
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  is_default BOOLEAN DEFAULT false,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CASH_REGISTERS (Cajas)
-- ============================================
CREATE TABLE IF NOT EXISTS cash_registers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT DEFAULT 'Caja Principal',
  user_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opening_amount NUMERIC(12,2) DEFAULT 0,
  closing_amount NUMERIC(12,2),
  expected_amount NUMERIC(12,2),
  difference NUMERIC(12,2),
  observations TEXT,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE
);

-- ============================================
-- CASH_MOVEMENTS (Movimientos de caja)
-- ============================================
CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cash_register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sale_in', 'sale_out', 'opening', 'closing', 'income', 'expense', 'adjustment')),
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  sale_id UUID,
  user_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SALES (Ventas)
-- ============================================
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number SERIAL,
  user_id UUID NOT NULL REFERENCES profiles(id),
  customer_id UUID REFERENCES customers(id),
  cash_register_id UUID REFERENCES cash_registers(id),
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) DEFAULT 0,
  tax NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'debit', 'credit', 'transfer', 'mercadopago', 'account', 'other')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled', 'refunded')),
  notes TEXT,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SALE_ITEMS (Items de venta)
-- ============================================
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- ============================================
-- PURCHASES (Compras)
-- ============================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number SERIAL,
  supplier_id UUID REFERENCES suppliers(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) DEFAULT 0,
  tax NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'cancelled')),
  notes TEXT,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PURCHASE_ITEMS (Items de compra)
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- ============================================
-- STOCK_MOVEMENTS (Movimientos de stock)
-- ============================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  type TEXT NOT NULL CHECK (type IN ('purchase', 'sale', 'adjustment', 'transfer_in', 'transfer_out', 'return')),
  quantity NUMERIC(12,2) NOT NULL,
  reference TEXT,
  notes TEXT,
  user_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STOCK_TRANSFERS (Transferencias)
-- ============================================
CREATE TABLE IF NOT EXISTS stock_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  to_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  user_id UUID NOT NULL REFERENCES profiles(id),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EXPENSES (Gastos)
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  cash_register_id UUID REFERENCES cash_registers(id),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS (Notificaciones)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('stock', 'cash', 'sale', 'subscription', 'system', 'update')),
  read BOOLEAN DEFAULT false,
  user_id UUID NOT NULL REFERENCES profiles(id),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBSCRIPTIONS (Suscripciones)
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'expired', 'cancelled', 'blocked')),
  plan TEXT NOT NULL DEFAULT 'free_trial' CHECK (plan IN ('free_trial', 'monthly')),
  trial_start TIMESTAMPTZ DEFAULT NOW(),
  trial_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '3 months'),
  payment_provider TEXT CHECK (payment_provider IN ('mercadopago', 'paypal')),
  payment_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUPPORT_TICKETS (Soporte)
-- ============================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  user_id UUID NOT NULL REFERENCES profiles(id),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES (Índices para performance)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_business ON profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_categories_business ON categories(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_business ON sales(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cash_registers_business ON cash_registers(business_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_register ON cash_movements(cash_register_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_expenses_business ON expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_business ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_business ON suppliers(business_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Función para obtener el business_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_business_id()
RETURNS UUID AS $$
  SELECT business_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Función para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Trigger para auto-crear perfil al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'admin'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para profile al crear usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles: cada usuario ve su propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles; CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles; CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Businesses: usuarios ven su propio negocio
DROP POLICY IF EXISTS "Users can view own business" ON businesses; CREATE POLICY "Users can view own business" ON businesses
  FOR SELECT USING (id = get_user_business_id());

DROP POLICY IF EXISTS "Admins can update own business" ON businesses; CREATE POLICY "Admins can update own business" ON businesses
  FOR UPDATE USING (id = get_user_business_id() AND is_admin());

DROP POLICY IF EXISTS "Admins can insert business" ON businesses; CREATE POLICY "Admins can insert business" ON businesses
  FOR INSERT WITH CHECK (true);

-- Categories: filtrado por business
DROP POLICY IF EXISTS "Users can view own categories" ON categories; CREATE POLICY "Users can view own categories" ON categories
  FOR SELECT USING (business_id = get_user_business_id());

DROP POLICY IF EXISTS "Admins can manage categories" ON categories; CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (business_id = get_user_business_id() AND is_admin());

-- Products: filtrado por business
DROP POLICY IF EXISTS "Users can view own products" ON products; CREATE POLICY "Users can view own products" ON products
  FOR SELECT USING (business_id = get_user_business_id());

DROP POLICY IF EXISTS "Admins can manage products" ON products; CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (business_id = get_user_business_id() AND is_admin());

DROP POLICY IF EXISTS "Encargados can manage products" ON products; CREATE POLICY "Encargados can manage products" ON products
  FOR ALL USING (business_id = get_user_business_id() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'encargado')));

-- Customers: filtrado por business
DROP POLICY IF EXISTS "Users can view own customers" ON customers; CREATE POLICY "Users can view own customers" ON customers
  FOR SELECT USING (business_id = get_user_business_id());

DROP POLICY IF EXISTS "Users can manage customers" ON customers; CREATE POLICY "Users can manage customers" ON customers
  FOR ALL USING (business_id = get_user_business_id());

-- Suppliers: filtrado por business
DROP POLICY IF EXISTS "Users can view own suppliers" ON suppliers; CREATE POLICY "Users can view own suppliers" ON suppliers
  FOR SELECT USING (business_id = get_user_business_id());

DROP POLICY IF EXISTS "Admins can manage suppliers" ON suppliers; CREATE POLICY "Admins can manage suppliers" ON suppliers
  FOR ALL USING (business_id = get_user_business_id() AND is_admin());

-- Sales: filtrado por business
DROP POLICY IF EXISTS "Users can view own sales" ON sales; CREATE POLICY "Users can view own sales" ON sales
  FOR SELECT USING (business_id = get_user_business_id());

DROP POLICY IF EXISTS "Users can create sales" ON sales; CREATE POLICY "Users can create sales" ON sales
  FOR INSERT WITH CHECK (business_id = get_user_business_id());

DROP POLICY IF EXISTS "Admins can manage sales" ON sales; CREATE POLICY "Admins can manage sales" ON sales
  FOR ALL USING (business_id = get_user_business_id() AND is_admin());

-- Sale Items: accesso a través de sale
DROP POLICY IF EXISTS "Users can view sale items" ON sale_items; CREATE POLICY "Users can view sale items" ON sale_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id AND sales.business_id = get_user_business_id())
  );

DROP POLICY IF EXISTS "Users can create sale items" ON sale_items; CREATE POLICY "Users can create sale items" ON sale_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id AND sales.business_id = get_user_business_id())
  );

-- Cash Registers: filtrado por business
DROP POLICY IF EXISTS "Users can view own cash registers" ON cash_registers; CREATE POLICY "Users can view own cash registers" ON cash_registers
  FOR SELECT USING (business_id = get_user_business_id());

DROP POLICY IF EXISTS "Users can manage cash registers" ON cash_registers; CREATE POLICY "Users can manage cash registers" ON cash_registers
  FOR ALL USING (business_id = get_user_business_id());

-- Cash Movements: accesso a través de cash_register
DROP POLICY IF EXISTS "Users can view cash movements" ON cash_movements; CREATE POLICY "Users can view cash movements" ON cash_movements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM cash_registers WHERE cash_registers.id = cash_movements.cash_register_id AND cash_registers.business_id = get_user_business_id())
  );

DROP POLICY IF EXISTS "Users can create cash movements" ON cash_movements; CREATE POLICY "Users can create cash movements" ON cash_movements
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM cash_registers WHERE cash_registers.id = cash_movements.cash_register_id AND cash_registers.business_id = get_user_business_id())
  );

-- Expenses: filtrado por business
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses; CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (business_id = get_user_business_id());

DROP POLICY IF EXISTS "Users can manage expenses" ON expenses; CREATE POLICY "Users can manage expenses" ON expenses
  FOR ALL USING (business_id = get_user_business_id());

-- Notifications: filtrado por user
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications; CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications; CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Subscriptions: filtrado por business
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions; CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (business_id = get_user_business_id());

-- Warehouses: filtrado por business
DROP POLICY IF EXISTS "Users can view own warehouses" ON warehouses; CREATE POLICY "Users can view own warehouses" ON warehouses
  FOR SELECT USING (business_id = get_user_business_id());

DROP POLICY IF EXISTS "Admins can manage warehouses" ON warehouses; CREATE POLICY "Admins can manage warehouses" ON warehouses
  FOR ALL USING (business_id = get_user_business_id() AND is_admin());

-- Brands: filtrado por business
DROP POLICY IF EXISTS "Users can view own brands" ON brands; CREATE POLICY "Users can view own brands" ON brands
  FOR SELECT USING (business_id = get_user_business_id());

DROP POLICY IF EXISTS "Admins can manage brands" ON brands; CREATE POLICY "Admins can manage brands" ON brands
  FOR ALL USING (business_id = get_user_business_id() AND is_admin());

-- Stock Movements: filtrado por warehouse
DROP POLICY IF EXISTS "Users can view stock movements" ON stock_movements; CREATE POLICY "Users can view stock movements" ON stock_movements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM warehouses WHERE warehouses.id = stock_movements.warehouse_id AND warehouses.business_id = get_user_business_id())
  );

DROP POLICY IF EXISTS "Users can create stock movements" ON stock_movements; CREATE POLICY "Users can create stock movements" ON stock_movements
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM warehouses WHERE warehouses.id = stock_movements.warehouse_id AND warehouses.business_id = get_user_business_id())
  );

-- Stock Transfers: filtrado por business
DROP POLICY IF EXISTS "Users can view own transfers" ON stock_transfers; CREATE POLICY "Users can view own transfers" ON stock_transfers
  FOR SELECT USING (business_id = get_user_business_id());

DROP POLICY IF EXISTS "Users can manage transfers" ON stock_transfers; CREATE POLICY "Users can manage transfers" ON stock_transfers
  FOR ALL USING (business_id = get_user_business_id());

-- Purchases: filtrado por business
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases; CREATE POLICY "Users can view own purchases" ON purchases
  FOR SELECT USING (business_id = get_user_business_id());

DROP POLICY IF EXISTS "Users can manage purchases" ON purchases; CREATE POLICY "Users can manage purchases" ON purchases
  FOR ALL USING (business_id = get_user_business_id());

-- Purchase Items: accesso a través de purchase
DROP POLICY IF EXISTS "Users can view purchase items" ON purchase_items; CREATE POLICY "Users can view purchase items" ON purchase_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM purchases WHERE purchases.id = purchase_items.purchase_id AND purchases.business_id = get_user_business_id())
  );

DROP POLICY IF EXISTS "Users can create purchase items" ON purchase_items; CREATE POLICY "Users can create purchase items" ON purchase_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM purchases WHERE purchases.id = purchase_items.purchase_id AND purchases.business_id = get_user_business_id())
  );

-- Support Tickets: filtrado por user
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets; CREATE POLICY "Users can view own tickets" ON support_tickets
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets; CREATE POLICY "Users can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid() AND business_id = get_user_business_id());

-- Product Variants: filtrado por product
DROP POLICY IF EXISTS "Users can view variants" ON product_variants; CREATE POLICY "Users can view variants" ON product_variants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM products WHERE products.id = product_variants.product_id AND products.business_id = get_user_business_id())
  );

DROP POLICY IF EXISTS "Users can manage variants" ON product_variants; CREATE POLICY "Users can manage variants" ON product_variants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM products WHERE products.id = product_variants.product_id AND products.business_id = get_user_business_id())
  );

-- ============================================
-- DATOS DEMO (Opcional)
-- ============================================

-- Crear business demo
INSERT INTO businesses (id, name, rubro, phone, address) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Kiosco Don Carlos', 'kiosco', '11-5555-0000', 'Av. San Martín 1234')
ON CONFLICT (id) DO NOTHING;

-- Crear categorías demo
INSERT INTO categories (id, name, icon, color, business_id) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'Bebidas', '🥤', '#3B82F6', 'a0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000002', 'Golosinas', '🍬', '#EC4899', 'a0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000003', 'Almacén', '🏪', '#F59E0B', 'a0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000004', 'Lácteos', '🥛', '#10B981', 'a0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000005', 'Panadería', '🍞', '#D97706', 'a0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000006', 'Carnicería', '🥩', '#EF4444', 'a0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000007', 'Limpieza', '🧹', '#6366F1', 'a0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000008', 'Dietética', '🥗', '#22C55E', 'a0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000009', 'Frescos', '🍎', '#F97316', 'a0000000-0000-4000-8000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Crear productos demo
INSERT INTO products (id, name, sku, barcode, category_id, cost, price, stock, min_stock, unit, tax, active, business_id) VALUES
  ('c0000000-0000-4000-8000-000000000001', 'Coca Cola 500ml', 'BEB-001', '77900001', 'b0000000-0000-4000-8000-000000000001', 1500, 2500, 24, 10, 'unit', 21, true, 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000002', 'Pepsi 500ml', 'BEB-002', '77900002', 'b0000000-0000-4000-8000-000000000001', 1400, 2300, 18, 10, 'unit', 21, true, 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000003', 'Agua Mineral 500ml', 'BEB-003', '77900003', 'b0000000-0000-4000-8000-000000000001', 600, 1200, 30, 15, 'unit', 21, true, 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000004', 'Alfajor Havanna', 'GOL-001', '77900004', 'b0000000-0000-4000-8000-000000000002', 700, 1200, 15, 8, 'unit', 21, true, 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000005', 'Galletitas Oreo', 'GOL-002', '77900005', 'b0000000-0000-4000-8000-000000000002', 1000, 1800, 12, 6, 'unit', 21, true, 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000006', 'Chocolate Milka', 'GOL-003', '77900006', 'b0000000-0000-4000-8000-000000000002', 1300, 2200, 8, 5, 'unit', 21, true, 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000007', 'Yerba Mate 1kg', 'ALM-001', '77900007', 'b0000000-0000-4000-8000-000000000003', 1200, 2000, 20, 10, 'unit', 21, true, 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000008', 'Azúcar 1kg', 'ALM-002', '77900008', 'b0000000-0000-4000-8000-000000000003', 900, 1500, 25, 10, 'unit', 21, true, 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000009', 'Harina 1kg', 'ALM-003', '77900009', 'b0000000-0000-4000-8000-000000000003', 600, 1100, 22, 10, 'unit', 21, true, 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000010', 'Leche La Serenísima', 'LAC-001', '77900010', 'b0000000-0000-4000-8000-000000000004', 900, 1500, 16, 8, 'unit', 21, true, 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000011', 'Queso Cremoso', 'LAC-002', '77900011', 'b0000000-0000-4000-8000-000000000004', 6000, 9500, 5, 3, 'kg', 10.5, true, 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000012', 'Pan Francés', 'PAN-001', '77900012', 'b0000000-0000-4000-8000-000000000005', 800, 1500, 30, 15, 'unit', 10.5, true, 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000013', 'Medialunas x6', 'PAN-002', '77900013', 'b0000000-0000-4000-8000-000000000005', 2000, 3500, 10, 5, 'unit', 10.5, true, 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000014', 'Carne', 'CAR-001', '77900014', 'b0000000-0000-4000-8000-000000000006', 5500, 9500, 8, 5, 'kg', 10.5, true, 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000015', 'Pollo Entero', 'CAR-002', '77900015', 'b0000000-0000-4000-8000-000000000006', 3200, 5800, 10, 5, 'kg', 10.5, true, 'a0000000-0000-4000-8000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Crear depósito demo
INSERT INTO warehouses (id, name, is_default, business_id) VALUES
  ('d0000000-0000-4000-8000-000000000001', 'Local', true, 'a0000000-0000-4000-8000-000000000001'),
  ('d0000000-0000-4000-8000-000000000002', 'Depósito', false, 'a0000000-0000-4000-8000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FIN DEL SCHEMA
-- ============================================

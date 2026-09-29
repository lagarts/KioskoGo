export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  business_id: string;
  avatar?: string;
  created_at: string;
}

export type UserRole = 'admin' | 'encargado' | 'cajero';

export interface Business {
  id: string;
  name: string;
  rubro: RubroType;
  phone?: string;
  address?: string;
  email?: string;
  logo?: string;
  cuit?: string;
  region: string;
  created_at: string;
}

export type RubroType =
  | 'kiosco'
  | 'almacen'
  | 'supermercado'
  | 'carniceria'
  | 'panaderia'
  | 'dietetica'
  | 'despensa'
  | 'fiambre'
  | 'verduleria'
  | 'otro';

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  category_id: string;
  subcategory_id?: string;
  brand_id?: string;
  supplier_id?: string;
  cost: number;
  price: number;
  stock: number;
  min_stock: number;
  unit: UnitType;
  tax: number;
  image?: string;
  active: boolean;
  business_id: string;
  created_at: string;
  updated_at: string;
}

export type UnitType = 'unit' | 'kg' | 'g' | 'l' | 'ml' | 'm';

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku?: string;
  barcode?: string;
  stock: number;
  price: number;
  cost: number;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  parent_id?: string;
  business_id: string;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  business_id: string;
}

export interface Supplier {
  id: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  cuit?: string;
  notes?: string;
  business_id: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  dni?: string;
  cuit?: string;
  address?: string;
  notes?: string;
  balance: number;
  business_id: string;
  created_at: string;
}

export interface Sale {
  id: string;
  number: number;
  user_id: string;
  customer_id?: string;
  cash_register_id?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: PaymentMethod;
  status: SaleStatus;
  notes?: string;
  branch_id?: string | null;
  business_id: string;
  created_at: string;
}

export type SaleStatus = 'completed' | 'cancelled' | 'refunded';
export type PaymentMethod = 'cash' | 'debit' | 'credit' | 'transfer' | 'mercadopago' | 'account' | 'other';

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export interface CashRegister {
  id: string;
  name: string;
  user_id: string;
  status: CashRegisterStatus;
  opening_amount: number;
  closing_amount?: number;
  expected_amount?: number;
  difference?: number;
  observations?: string;
  opened_at: string;
  closed_at?: string;
  branch_id?: string | null;
  business_id: string;
}

export type CashRegisterStatus = 'open' | 'closed';

export interface CashMovement {
  id: string;
  cash_register_id: string;
  type: CashMovementType;
  amount: number;
  description: string;
  sale_id?: string;
  user_id: string;
  created_at: string;
}

export type CashMovementType = 'sale_in' | 'sale_out' | 'opening' | 'closing' | 'income' | 'expense' | 'adjustment';

export interface Purchase {
  id: string;
  number: number;
  supplier_id?: string;
  user_id: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: PurchaseStatus;
  notes?: string;
  business_id: string;
  created_at: string;
}

export type PurchaseStatus = 'pending' | 'received' | 'cancelled';

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  total: number;
}

export interface StockMovement {
  id: string;
  product_id: string;
  variant_id?: string;
  warehouse_id: string;
  type: StockMovementType;
  quantity: number;
  reference?: string;
  notes?: string;
  user_id: string;
  created_at: string;
}

export type StockMovementType = 'purchase' | 'sale' | 'adjustment' | 'transfer_in' | 'transfer_out' | 'return';

export interface Warehouse {
  id: string;
  name: string;
  address?: string;
  is_default: boolean;
  business_id: string;
}

export interface Branch {
  id: string;
  business_id: string;
  name: string;
  address?: string | null;
  active: boolean;
  created_at: string;
}

export interface StockTransfer {
  id: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  user_id: string;
  business_id: string;
  created_at: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  user_id: string;
  cash_register_id?: string;
  business_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  user_id: string;
  business_id: string;
  created_at: string;
}

export type NotificationType = 'stock' | 'cash' | 'sale' | 'subscription' | 'system' | 'update';

export interface Subscription {
  id: string;
  business_id: string;
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  trial_start?: string;
  trial_end?: string;
  payment_provider?: 'mercadopago' | 'paypal';
  payment_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  created_at: string;
}

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'expired' | 'cancelled' | 'blocked';
export type SubscriptionPlan = 'free_trial' | 'monthly';

export interface HardwareConfig {
  barcode_scanner: {
    connected: boolean;
    type: 'hid' | 'serial' | 'usb' | 'network';
    port?: string;
  };
  printer: {
    connected: boolean;
    type: 'thermal_58' | 'thermal_80' | 'label';
    port?: string;
  };
  scale: {
    connected: boolean;
    type: 'usb' | 'serial' | 'network';
    port?: string;
  };
}

export interface BusinessUser {
  id: string;
  user_id: string;
  business_id: string;
  role: UserRole;
  active: boolean;
  created_at: string;
}

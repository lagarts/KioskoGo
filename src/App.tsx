import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/Dashboard';
import { SettingsPage } from './pages/settings/SettingsPage';
import { POSPage } from './pages/sales/POSPage';
import { CashPage } from './pages/cash/CashPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { CategoriesPage } from './pages/categories/CategoriesPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { SuppliersPage } from './pages/suppliers/SuppliersPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { ExpensesPage } from './pages/expenses/ExpensesPage';
import { AdminPage } from './pages/admin/AdminPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import {
  Warehouse,
  ArrowLeftRight,
  Barcode,
  Ticket,
  CreditCard,
  FileText,
  HelpCircle,
  Receipt,
  ShoppingCart as PurchaseIcon,
} from 'lucide-react';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout><Dashboard /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/new"
        element={
          <ProtectedRoute>
            <MainLayout><POSPage /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/cash"
        element={
          <ProtectedRoute>
            <MainLayout><CashPage /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <MainLayout><ProductsPage /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <MainLayout><CategoriesPage /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <MainLayout><CustomersPage /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/suppliers"
        element={
          <ProtectedRoute>
            <MainLayout><SuppliersPage /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlaceholderPage title="Historial de Ventas" description="Registro completo de todas las ventas realizadas" icon={<Receipt size={20} />} />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/purchases"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlaceholderPage title="Compras" description="Registra y gestiona compras a proveedores" icon={<PurchaseIcon size={20} />} />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/stock"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlaceholderPage title="Stock" description="Control de inventario y movimientos de stock" icon={<Warehouse size={20} />} />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/transfers"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlaceholderPage title="Transferencias" description="Transfiere productos entre depósitos" icon={<ArrowLeftRight size={20} />} />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/barcode"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlaceholderPage title="Códigos de Barras" description="Genera e imprime códigos de barras" icon={<Barcode size={20} />} />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/labels"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlaceholderPage title="Etiquetas" description="Diseña e imprime etiquetas de productos" icon={<Ticket size={20} />} />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <MainLayout><ReportsPage /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment-methods"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlaceholderPage title="Métodos de Pago" description="Configura los métodos de pago aceptados" icon={<CreditCard size={20} />} />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/accounts"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlaceholderPage title="Cuentas Corrientes" description="Gestiona créditos y pagos de clientes" icon={<FileText size={20} />} />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <MainLayout><ExpensesPage /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <MainLayout><SettingsPage /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <MainLayout><AdminPage /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/support"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlaceholderPage title="Soporte" description="Centro de ayuda y soporte técnico" icon={<HelpCircle size={20} />} />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

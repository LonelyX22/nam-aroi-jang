import { Navigate, Route, Routes } from 'react-router-dom'
import CustomerLayout from './components/CustomerLayout'
import AdminLayout from './components/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import MenuPage from './pages/MenuPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import PointsPage from './pages/PointsPage'
import TrackOrderPage from './pages/TrackOrderPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/admin/LoginPage'
import SetPasswordPage from './pages/admin/SetPasswordPage'
import DashboardPage from './pages/admin/DashboardPage'
import OrdersPage from './pages/admin/OrdersPage'
import ProductsPage from './pages/admin/ProductsPage'
import CustomersPage from './pages/admin/CustomersPage'
import PointsAdminPage from './pages/admin/PointsAdminPage'
import PromotionsPage from './pages/admin/PromotionsPage'
import PaymentsPage from './pages/admin/PaymentsPage'
import ReportsPage from './pages/admin/ReportsPage'
import SettingsPage from './pages/admin/SettingsPage'
import StaffPage from './pages/admin/StaffPage'

function OwnerOnly({ children }) {
  return <ProtectedRoute ownerOnly>{children}</ProtectedRoute>
}

export default function App() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route index element={<HomePage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="menu/:id" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="points" element={<PointsPage />} />
        <Route path="track" element={<TrackOrderPage />} />
        <Route path="order-success" element={<OrderSuccessPage />} />
      </Route>

      <Route path="admin/login" element={<LoginPage />} />
      <Route path="admin/set-password" element={<SetPasswordPage />} />
      <Route path="admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="products" element={<OwnerOnly><ProductsPage /></OwnerOnly>} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="points" element={<OwnerOnly><PointsAdminPage /></OwnerOnly>} />
        <Route path="promotions" element={<OwnerOnly><PromotionsPage /></OwnerOnly>} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="reports" element={<OwnerOnly><ReportsPage /></OwnerOnly>} />
        <Route path="settings" element={<OwnerOnly><SettingsPage /></OwnerOnly>} />
        <Route path="staff" element={<OwnerOnly><StaffPage /></OwnerOnly>} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

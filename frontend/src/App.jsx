import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/useAuthStore';
import { ToastContainer } from './components/Toast';

// Layouts
import { ShopperLayout } from './layouts/ShopperLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Pages
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage
} from './pages/AuthPages';
import { ShopperCatalog } from './pages/ShopperCatalog';
import { ShopperProductDetails } from './pages/ShopperProductDetails';
import { ShopperCart } from './pages/ShopperCart';
import { ShopperCheckout } from './pages/ShopperCheckout';
import { ShopperOrders } from './pages/ShopperOrders';
import { UserProfile } from './pages/UserProfile';
import { Unauthorized } from './pages/Unauthorized';

// Staff Pages
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminAnalytics } from './pages/AdminAnalytics';
import { AdminOrders } from './pages/AdminOrders';
import { AdminProducts } from './pages/AdminProducts';
import { AdminCategories } from './pages/AdminCategories';
import { AdminUsers } from './pages/AdminUsers';
import { AdminMetrics } from './pages/AdminMetrics';
import { WarehouseOverrides } from './pages/WarehouseOverrides';

// Merchant Pages
import { SellerDashboard } from './pages/SellerDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const initSession = useAuthStore((s) => s.initSession);

  // Hydrate user session from localStorage on boot
  useEffect(() => {
    initSession();
  }, [initSession]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Shopper Interface Routes */}
          <Route element={<ShopperLayout />}>
            <Route path="/" element={<Navigate to="/products" replace />} />
            <Route path="/products" element={<ShopperCatalog />} />
            <Route path="/products/:productId" element={<ShopperProductDetails />} />
            <Route path="/cart" element={<ShopperCart />} />
            <Route path="/checkout" element={<ShopperCheckout />} />
            <Route path="/my-orders" element={<ShopperOrders />} />
            <Route path="/my-orders/:orderId" element={<ShopperOrders />} />
            <Route path="/profile" element={<UserProfile />} />
          </Route>

          {/* Merchant Interface Routes */}
          <Route element={<ShopperLayout />}>
            <Route path="/seller/dashboard" element={<SellerDashboard />} />
          </Route>

          {/* Admin & Staff Interface Routes */}
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/metrics" element={<AdminMetrics />} />
            <Route path="/inventory" element={<WarehouseOverrides />} />
          </Route>

          {/* Wildcard Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Floating Toast HUD */}
        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

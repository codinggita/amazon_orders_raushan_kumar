import React from 'react';
import { Navigate, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Users, Box, Tags, ShieldAlert, Cpu, Warehouse, LogOut, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/Toast';

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const addToast = useToast((s) => s.addToast);
  const { user, clearSession } = useAuthStore();

  const handleLogout = () => {
    clearSession();
    addToast('Logged out successfully.', 'info');
    navigate('/login');
  };

  const isStaff = user && ['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_MANAGER', 'INVENTORY_MANAGER', 'SUPPORT_AGENT'].includes(user.role);
  if (!isStaff) {
    return <Navigate to="/unauthorized" replace />;
  }

  const navItems = [
    { path: '/admin/dashboard', label: 'Executive Stats', icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: '/admin/analytics', label: 'Analytics Insights', icon: <BarChart3 className="w-4 h-4" /> },
    { path: '/admin/orders', label: 'Order Records', icon: <Box className="w-4 h-4" /> },
    { path: '/admin/products', label: 'Product Catalog', icon: <Box className="w-4 h-4 text-primary" /> },
    { path: '/admin/categories', label: 'Taxonomy Divisions', icon: <Tags className="w-4 h-4" /> },
    { path: '/admin/users', label: 'User Ledger', icon: <Users className="w-4 h-4" /> },
    { path: '/inventory', label: 'Warehouse Overrides', icon: <Warehouse className="w-4 h-4" /> },
    { path: '/admin/metrics', label: 'System Metrics HUD', icon: <Cpu className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row transition-colors duration-300">
      <aside className="w-full md:w-64 bg-card/90 border-r border-white/5 flex flex-col justify-between py-6 px-4 md:sticky md:top-0 md:h-screen">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-extrabold text-white tracking-widest hover:opacity-90">
              <span>ADMIN<span className="text-primary">.INTEL</span></span>
            </Link>
            <Link to="/" className="md:hidden text-gray-400 hover:text-white transition-colors" title="Back to Portal">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl p-3">
            <div className="w-8 h-8 bg-primary/20 border border-primary/30 text-primary font-bold rounded-lg flex items-center justify-center text-xs">
              AD
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white text-xs font-bold truncate">{user?.fullName || user?.firstName}</span>
              <span className="text-[9px] text-gray-400 uppercase font-semibold tracking-wider truncate">{user?.role}</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    active ? 'bg-primary text-white shadow-md shadow-primary/10' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-3 mt-8">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 border border-white/5 hover:border-white/10 bg-black/40 text-gray-300 hover:text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-all"
          >
            Shopper View
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 bg-rose-950/20 hover:bg-rose-950/30 border border-rose-900/20 text-rose-400 font-semibold text-xs py-2.5 px-4 rounded-xl transition-all"
          >
            <LogOut className="w-4.5 h-4.5" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col gap-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};
export default AdminLayout;

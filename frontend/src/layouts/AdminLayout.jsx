import React, { useState } from 'react';
import { Navigate, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Users, Box, Tags, ShieldAlert, Cpu, Warehouse, LogOut, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/Toast';

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const addToast = useToast((s) => s.addToast);
  const { user, clearSession } = useAuthStore();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = () => {
    setShowLogoutModal(false);
    clearSession();
    addToast('Logged out successfully.', 'info');
    navigate('/login');
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const isStaff = user && ['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_MANAGER', 'INVENTORY_MANAGER', 'SUPPORT_AGENT'].includes(user.role?.toUpperCase());
  if (!isStaff) {
    return <Navigate to="/unauthorized" replace />;
  }

  const navItems = [
    { path: '/admin/dashboard', label: 'Executive Stats', icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: '/admin/analytics', label: 'Analytics Insights', icon: <BarChart3 className="w-4 h-4" /> },
    { path: '/admin/orders', label: 'Order Records', icon: <Box className="w-4 h-4" /> },
    { path: '/admin/products', label: 'Product Catalog', icon: <Box className="w-4 h-4" /> },
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
            <Link to="/" className="flex items-center space-x-3 group cursor-pointer hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 bg-[#0a110f] border border-primary flex items-center justify-center p-1 shrink-0">
                <img src="/cartx-logo.png" alt="CartX Logo" className="w-full h-full object-cover rounded-lg" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-white transition-all duration-500">
                Cart<span className="text-primary drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">X</span>
                <span className="text-[10px] text-gray-500 ml-2 font-black tracking-widest uppercase align-top">Admin</span>
              </span>
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
            onClick={handleLogoutClick}
            className="flex items-center justify-center gap-2 bg-rose-950/20 hover:bg-rose-950/30 border border-rose-900/20 text-rose-400 font-semibold text-xs py-2.5 px-4 rounded-xl transition-all"
          >
            <LogOut className="w-4.5 h-4.5" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col gap-6 max-w-7xl mx-auto w-full relative">
        <Outlet />
      </main>

      {/* Centered Sign-out Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <h3 className="text-white font-extrabold text-lg">Sign Out</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Are you sure you want to end your active session? You will need to log back in to access checkout and dashboards.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3.5 px-4 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-rose-500/10 hover:shadow-rose-500/20 transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminLayout;

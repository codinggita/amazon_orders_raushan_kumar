import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingCart, LogOut, User, Package, Shield, Sun, Moon, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useToast } from '../components/Toast';

export const ShopperLayout = () => {
  const navigate = useNavigate();
  const addToast = useToast((s) => s.addToast);
  const { user, clearSession, theme, toggleTheme } = useAuthStore();
  const cartItemsCount = useCartStore((s) => s.items.length);

  const handleLogout = () => {
    clearSession();
    addToast('Logged out successfully.', 'info');
    navigate('/login');
  };

  const isStaff = user && ['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_MANAGER', 'INVENTORY_MANAGER', 'SUPPORT_AGENT'].includes(user.role);
  const isSeller = user && ['SELLER', 'VERIFIED_SELLER'].includes(user.role);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 font-bold text-white tracking-wider hover:opacity-90 transition-opacity">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>COMMERCE<span className="text-primary">.INTEL</span></span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/products" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                Catalog
              </Link>
              {user && (
                <Link to="/my-orders" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                  My Orders
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link
              to="/cart"
              className="relative p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-background shadow-lg">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-white/10">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-white text-xs font-semibold">{user.fullName || user.firstName}</span>
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{user.role}</span>
                </div>

                <div className="relative group">
                  <button className="w-9 h-9 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl flex items-center justify-center text-white font-medium hover:bg-white/10 transition-all">
                    <User className="w-4 h-4" />
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-white/5 rounded-xl shadow-xl py-1 hidden group-hover:block transition-all z-50">
                    <Link to="/profile" className="flex items-center gap-2 px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                      <User className="w-3.5 h-3.5" />
                      My Profile
                    </Link>
                    
                    {isStaff && (
                      <Link to="/admin/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                        <Shield className="w-3.5 h-3.5 text-primary" />
                        Admin Dashboard
                      </Link>
                    )}

                    {isSeller && (
                      <Link to="/seller/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                        <Package className="w-3.5 h-3.5 text-emerald-400" />
                        Seller Dashboard
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-colors border-t border-white/5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-md transition-all active:scale-[0.97]"
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        <Outlet />
      </main>

      <footer className="border-t border-white/5 bg-black/20 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>© {new Date().getFullYear()} Commerce Intelligence Platform. All rights reserved.</div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default ShopperLayout;

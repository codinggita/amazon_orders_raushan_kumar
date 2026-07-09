import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingCart, LogOut, User, Package, Shield, Sun, Moon, Sparkles, X, Menu } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useToast } from '../components/Toast';

export const ShopperLayout = () => {
  const navigate = useNavigate();
  const addToast = useToast((s) => s.addToast);
  const { user, clearSession, theme, toggleTheme } = useAuthStore();
  const cartItemsCount = useCartStore((s) => s.items.length);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const confirmLogout = () => {
    setShowLogoutModal(false);
    clearSession();
    addToast('Logged out successfully.', 'info');
    navigate('/login');
  };

  const isStaff = user && ['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_MANAGER', 'INVENTORY_MANAGER', 'SUPPORT_AGENT'].includes(user.role?.toUpperCase());
  const isSeller = user && ['SELLER', 'VERIFIED_SELLER'].includes(user.role?.toUpperCase());

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300 relative">
      
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

      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#0a110f]/80 backdrop-blur-xl shadow-xl shadow-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center space-x-3 group cursor-pointer hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 bg-[#0a110f] border border-primary flex items-center justify-center p-1 shrink-0">
                <img src="/cartx-logo.png" alt="CartX Logo" className="w-full h-full object-cover rounded-lg" />
              </div>
              <span className="text-xl md:text-2xl font-extrabold tracking-tight text-white transition-all duration-500">
                Cart<span className="text-primary drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">X</span>
              </span>
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
              className="hidden md:block p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
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
              <div className="hidden md:flex items-center gap-3 pl-3 border-l border-white/10">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-white text-xs font-semibold">{user.fullName || user.firstName}</span>
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{user.role}</span>
                </div>

                <div className="relative group">
                  <button className="w-9 h-9 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl flex items-center justify-center text-white font-medium hover:bg-white/10 transition-all">
                    <User className="w-4 h-4" />
                  </button>

                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                    <div className="p-2 space-y-1">
                      <Link to="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      {isStaff && (
                        <Link to="/admin/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors">
                          <Shield className="w-4 h-4" />
                          Admin Portal
                        </Link>
                      )}
                      {isSeller && (
                        <Link to="/seller/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-400/10 rounded-lg transition-colors">
                          <Package className="w-4 h-4" />
                          Seller Portal
                        </Link>
                      )}
                      <div className="h-px bg-slate-800 my-1" />
                      <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-gray-400 hover:text-white bg-white/5 rounded-xl"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#0a110f]/95 backdrop-blur-xl">
            <div className="px-4 py-4 flex flex-col gap-3">
              <Link to="/products" className="text-white font-medium px-2 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                Catalog
              </Link>
              {user && (
                <Link to="/my-orders" className="text-white font-medium px-2 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                  My Orders
                </Link>
              )}
              <button
                onClick={() => {
                  toggleTheme();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 text-gray-300 font-medium px-2 py-2"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                Toggle Theme
              </button>
              {user ? (
                <>
                  <div className="h-px bg-white/10 my-1" />
                  <div className="px-2 py-2 text-gray-400 text-sm">
                    Logged in as <span className="text-white">{user.firstName || user.name || user.email}</span>
                  </div>
                  <Link to="/profile" className="text-white font-medium px-2 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                    Profile
                  </Link>
                  {isStaff && (
                    <Link to="/admin/dashboard" className="text-primary font-medium px-2 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                      Admin Portal
                    </Link>
                  )}
                  {isSeller && (
                    <Link to="/seller/dashboard" className="text-purple-400 font-medium px-2 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                      Seller Portal
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setShowLogoutModal(true);
                    }}
                    className="flex items-center gap-2 text-red-400 font-medium px-2 py-2"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="bg-primary text-slate-950 font-bold px-4 py-3 rounded-xl text-center mt-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        <Outlet />
      </main>

      <footer className="border-t border-white/5 bg-black/20 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>© {new Date().getFullYear()} Cart<span className="text-primary drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">X</span> Platform. All rights reserved.</div>
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

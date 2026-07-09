import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Shield, Award, Sparkles, BarChart2, Globe, HeartPulse, Terminal, ArrowUpRight, Cpu, LogOut, Zap, Headphones, ChevronRight, LayoutGrid, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/Toast';
import { fetchOrders, searchCatalog } from '../services/resourceApi';

export const LandingPage = () => {
  const { user, clearSession } = useAuthStore();
  const navigate = useNavigate();
  const addToast = useToast((s) => s.addToast);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const confirmLogout = () => {
    setShowLogoutModal(false);
    clearSession();
    addToast('Logged out successfully.', 'info');
    navigate('/login');
  };

  // Determine CTA text and route based on role
  let ctaText = 'Explore Hardware';
  let ctaRoute = '/products';
  
  if (user) {
    const role = user.role?.toUpperCase();
    if (role === 'SELLER') {
      ctaText = 'Manage Inventory';
      ctaRoute = '/seller/dashboard';
    } else if (['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_MANAGER', 'INVENTORY_MANAGER', 'SUPPORT_AGENT'].includes(role)) {
      ctaText = 'System Telemetry';
      ctaRoute = '/admin/dashboard';
    } else {
      ctaText = 'Continue Shopping';
      ctaRoute = '/products';
    }
  }

  // --- Dynamic Telemetry Section Logic ---
  // Fetch user orders if logged in
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['landing-orders', user?.id],
    queryFn: fetchOrders,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const orders = ordersData?.data || [];
  const hasOrders = orders.length > 0;
  
  // Determine preferred category from last order, if any
  let preferredCategory = '';
  if (hasOrders) {
    // simplified: just pick the category of the first item in the most recent order
    const lastOrderItems = orders[0]?.items || [];
    if (lastOrderItems.length > 0 && lastOrderItems[0]?.product?.category?.name) {
      preferredCategory = lastOrderItems[0].product.category.name;
    }
  }

  const { data: telemetryData, isLoading: telemetryLoading } = useQuery({
    queryKey: ['landing-telemetry', preferredCategory],
    queryFn: () => {
      // If we have a preferred category, fetch related items
      if (preferredCategory) {
         return searchCatalog({ category: preferredCategory, limit: 4, sortBy: 'popularity' });
      }
      // Fallback: fetch trending hardware
      return searchCatalog({ sortBy: 'popularity', limit: 4 });
    },
    staleTime: 5 * 60 * 1000,
  });

  const telemetryProducts = telemetryData?.data || [];
  const telemetryTitle = preferredCategory ? `// RECENT TELEMETRY: RECOMMENDATIONS BASED ON [${preferredCategory.toUpperCase()}]` : '// RECENT TELEMETRY: TRENDING HARDWARE';

  return (
    <div className="min-h-screen bg-[#0a110f] font-sans selection:bg-primary/30 selection:text-white flex flex-col relative overflow-hidden text-slate-200">
      <Helmet>
        <title>CartX - Next Generation E-Commerce Orchestration</title>
        <meta name="description" content="State-of-the-art e-commerce orchestration layer. Track transitions, security states, and conversion pipelines with CartX." />
        
        {/* Open Graph Tags for Social Media */}
        <meta property="og:title" content="CartX - Next Generation E-Commerce Orchestration" />
        <meta property="og:description" content="State-of-the-art e-commerce orchestration layer. Track transitions, security states, and conversion pipelines with CartX." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://cartx.com" />
        <meta property="og:image" content="https://cartx.com/cartx-logo.png" />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="CartX - Next Generation E-Commerce Orchestration" />
        <meta name="twitter:description" content="State-of-the-art e-commerce orchestration layer. Track transitions, security states, and conversion pipelines with CartX." />
        <meta name="twitter:image" content="https://cartx.com/cartx-logo.png" />
      </Helmet>

      {/* Global Glow Effects */}
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

      {/* Background Image Showcase Overlay with low opacity to preserve text readability */}
      <div 
        className="absolute inset-0 bg-cover bg-right opacity-60 pointer-events-none select-none transition-all duration-1000" 
        style={{ backgroundImage: "url('/hero-bg-accessories.png')" }}
      />
      {/* Second Background Image for Top-Left */}
      <div 
        className="absolute inset-0 bg-contain bg-left-top bg-no-repeat opacity-50 pointer-events-none select-none transition-all duration-1000" 
        style={{ 
          backgroundImage: "url('/hero-bg-accessories-left.png')",
          maskImage: "radial-gradient(ellipse at top left, black 40%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at top left, black 40%, transparent 70%)"
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a110f]/15 via-[#0a110f]/65 to-[#0a110f] pointer-events-none" />

      {/* Header — Fixed Glassmorphism Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-[#0a110f]/80 backdrop-blur-xl border-b border-white/5 shadow-xl shadow-black/30">
        <div className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 bg-[#0a110f] border border-primary flex items-center justify-center p-1 shrink-0">
            <img src="/cartx-logo.png" alt="CartX Logo" className="w-full h-full object-cover rounded-lg" />
          </div>
          <span className="text-xl md:text-2xl font-extrabold tracking-tight text-white transition-all duration-500">
            Cart<span className="text-primary drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">X</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/products" className="text-sm font-bold text-slate-300 hover:text-primary transition-all duration-300 relative group py-1">
              Catalog
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
            {user ? (
              <>
                {user.role && ['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_MANAGER', 'INVENTORY_MANAGER', 'SUPPORT_AGENT'].includes(user.role.toUpperCase()) && (
                  <Link to="/admin/dashboard" className="text-sm font-bold text-primary hover:text-emerald-300 transition-all duration-300 relative group py-1">
                    Admin Panel
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-400 transition-all duration-300 group-hover:w-full" />
                  </Link>
                )}
                {/* Double-layered card layout with spinning gradient border background */}
                <div className="relative p-[1px] rounded-2xl overflow-hidden group select-none mx-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-emerald-400 to-teal-400 rounded-2xl animate-spin-gradient" />
                  <span className="relative block text-xs md:text-sm text-white font-extrabold px-6 py-1.5 bg-slate-950 rounded-2xl z-10 tracking-wide">
                    Hi, {user.firstName || user.name || user.fullName || user.email}
                  </span>
                </div>
                <button 
                  onClick={() => setShowLogoutModal(true)} 
                  className="text-sm bg-slate-900 border border-white/10 hover:border-primary hover:bg-slate-800 text-white px-4 py-2 rounded-xl hover:scale-105 active:scale-95 transition-all duration-300 font-bold"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-sm font-bold text-slate-300 hover:text-white transition-all duration-300 relative group py-1"
                >
                  Sign In
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full" />
                </Link>
                <Link 
                  to="/register" 
                  className="bg-primary hover:bg-primary/95 text-slate-950 text-sm font-bold px-4 py-2 rounded-xl transition-all hover:scale-105 hover:border-white active:scale-95 shadow-lg shadow-primary/20 border border-transparent"
                >
                  Register
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/5 bg-[#0a110f]/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="px-6 py-6 flex flex-col gap-6">
                <Link to="/products" className="text-white font-bold text-lg" onClick={() => setIsMobileMenuOpen(false)}>
                  Catalog
                </Link>
                {user ? (
                  <>
                    {user.role && ['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_MANAGER', 'INVENTORY_MANAGER', 'SUPPORT_AGENT'].includes(user.role.toUpperCase()) && (
                      <Link to="/admin/dashboard" className="text-primary font-bold text-lg" onClick={() => setIsMobileMenuOpen(false)}>
                        Admin Panel
                      </Link>
                    )}
                    <div className="text-gray-400 text-sm py-2 border-t border-white/10">
                      Logged in as <span className="text-white font-bold">{user.firstName || user.name || user.fullName || user.email}</span>
                    </div>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setShowLogoutModal(true);
                      }}
                      className="flex items-center gap-2 text-red-400 font-bold text-lg"
                    >
                      <LogOut className="w-5 h-5" /> Logout
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3 mt-2">
                    <Link
                      to="/login"
                      className="border border-white/10 hover:border-primary text-white font-extrabold px-5 py-3 rounded-xl text-center w-full"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="bg-primary text-slate-950 font-extrabold px-5 py-3 rounded-xl text-center w-full"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-36 pb-16 min-h-screen flex flex-col justify-end items-center text-center z-10">
        
        <motion.div
           initial="hidden"
           animate="visible"
           variants={{
             hidden: { opacity: 0 },
             visible: {
               opacity: 1,
               transition: {
                 staggerChildren: 0.1
               }
             }
           }}
           className="flex flex-col items-center"
        >
          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
            }}
            className="inline-flex items-center space-x-2 bg-slate-900/80 border border-white/5 backdrop-blur-md px-5 py-2 rounded-full text-sm text-primary mb-10 shadow-sm hover:border-primary/30 transition-all duration-300"
          >
            <Sparkles className="h-4 w-4 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="font-bold tracking-wide">Verified Premium Essentials</span>
          </motion.div>

          <motion.h1 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
            }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-5xl leading-tight md:leading-[1.05] mb-8 text-white"
          >
            Elevate Your Standard. Without{' '}
            <span className="bg-gradient-to-r from-primary via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Compromise.
            </span>
          </motion.h1>

          <motion.p 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
            }}
            className="text-base md:text-lg text-slate-300 max-w-2xl mb-12 leading-relaxed font-medium"
          >
            Discover a curated collection of smart tech, audio, and everyday accessories you can actually trust. Built to look better, last longer, and delivered securely to every pin code.
          </motion.p>

          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
            }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-xl mt-4 pb-16 z-20"
          >
            <Link 
              to={ctaRoute}
              className="relative w-full sm:w-auto px-8 py-4 text-sm rounded-xl font-black text-slate-950 uppercase tracking-widest transition-all duration-700 hover:scale-110 hover:[transform:rotateX(360deg)] active:scale-95 group/btn overflow-hidden flex items-center justify-center gap-2 border border-primary/40 hover:border-white shadow-[0_0_25px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.7)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-emerald-400 to-[#10b981] group-hover/btn:bg-[length:200%_auto] group-hover/btn:animate-[shimmer_1.5s_ease-in-out] transition-all duration-700" />
              <span className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-slate-950/40 group-hover/btn:border-white/60 transition-colors" />
              <span className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-slate-950/40 group-hover/btn:border-white/60 transition-colors" />
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-emerald-500 rounded-2xl blur opacity-30 group-hover/btn:opacity-100 transition-opacity duration-300 -z-10" />

              <Terminal className="h-5.5 w-5.5 z-10 transition-transform duration-300 group-hover/btn:rotate-12 group-hover/btn:scale-110" />
              <span className="z-10 tracking-widest drop-shadow-sm font-black">{ctaText}</span>
            </Link>
            {!user && (
              <Link 
                to="/register" 
                className="w-full sm:w-auto inline-flex items-center justify-center bg-slate-950/80 border border-white/10 hover:border-primary text-white font-bold px-8 py-4 text-sm rounded-xl backdrop-blur-md transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 active:scale-95 uppercase tracking-wider"
              >
                Partner Portal
              </Link>
            )}
          </motion.div>
        </motion.div>
      </main>

      {/* Feature Cards — Second Viewport Section */}
      <section className="w-full bg-[#070e0b] border-t border-white/5 py-24 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          {/* Feature Section Header */}
          <div className="flex flex-col items-center text-center gap-4 mb-14 w-full">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full">
              <Sparkles className="w-3 h-3" /> Core Categories
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight max-w-2xl">
              Engineered for Pros.{' '}
              <span className="bg-gradient-to-r from-primary via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Built to Last.
              </span>
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-xl leading-relaxed">
              Explore our curated selection of high-performance electronics designed for serious workflows.
            </p>
          </div>

          {/* Feature Grid with Framer Motion scroll reveal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full z-20">
            
            {/* Card 1: Compute Power */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative bg-slate-950/70 border border-white/5 backdrop-blur-md p-8 rounded-3xl text-left transition-all duration-500 group overflow-hidden hover:-translate-y-3 hover:border-primary hover:shadow-[0_20px_40px_rgba(16,185,129,0.25)] flex flex-col justify-between min-h-[250px]"
            >
              <div className="absolute -inset-20 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <span className="absolute top-2 left-2 w-3.5 h-3.5 border-t border-l border-white/10 group-hover:border-primary transition-colors duration-300" />
              <span className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r border-white/10 group-hover:border-primary transition-colors duration-300" />

              <div className="z-10">
                <div className="bg-gradient-to-br from-primary/20 to-emerald-950/40 border border-primary/30 p-4 rounded-2xl text-primary w-fit mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <Cpu className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-extrabold text-white mb-3 tracking-wide transition-colors group-hover:text-primary">Compute Power</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                  Discover elite laptops and workstations engineered for developers and heavy computational workloads.
                </p>
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5 z-10">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Laptops & Workstations</span>
                <Link to="/products?category=Electronics" className="text-primary font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  View Systems <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>

            {/* Card 2: Acoustic Precision */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              className="relative bg-slate-950/70 border border-white/5 backdrop-blur-md p-8 rounded-3xl text-left transition-all duration-500 group overflow-hidden hover:-translate-y-3 hover:border-primary hover:shadow-[0_20px_40px_rgba(16,185,129,0.25)] flex flex-col justify-between min-h-[250px]"
            >
              <div className="absolute -inset-20 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <span className="absolute top-2 left-2 w-3.5 h-3.5 border-t border-l border-white/10 group-hover:border-primary transition-colors duration-300" />
              <span className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r border-white/10 group-hover:border-primary transition-colors duration-300" />

              <div className="z-10">
                <div className="bg-gradient-to-br from-primary/20 to-emerald-950/40 border border-primary/30 p-4 rounded-2xl text-primary w-fit mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <Headphones className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-extrabold text-white mb-3 tracking-wide transition-colors group-hover:text-primary">Acoustic Precision</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                  High-fidelity true wireless earbuds and noise-canceling headsets for uninterrupted focus.
                </p>
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5 z-10">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Audio & Headsets</span>
                <Link to="/products?category=Audio" className="text-primary font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  View Audio <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>

            {/* Card 3: Ecosystem Peripherals */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              className="relative bg-slate-950/70 border border-white/5 backdrop-blur-md p-8 rounded-3xl text-left transition-all duration-500 group overflow-hidden hover:-translate-y-3 hover:border-primary hover:shadow-[0_20px_40px_rgba(16,185,129,0.25)] flex flex-col justify-between min-h-[250px]"
            >
              <div className="absolute -inset-20 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <span className="absolute top-2 left-2 w-3.5 h-3.5 border-t border-l border-white/10 group-hover:border-primary transition-colors duration-300" />
              <span className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r border-white/10 group-hover:border-primary transition-colors duration-300" />

              <div className="z-10">
                <div className="bg-gradient-to-br from-primary/20 to-emerald-950/40 border border-primary/30 p-4 rounded-2xl text-primary w-fit mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <Zap className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-extrabold text-white mb-3 tracking-wide transition-colors group-hover:text-primary">Ecosystem Peripherals</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                  Fast-charging docks, mechanical keyboards, and the essential gear to complete your setup.
                </p>
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5 z-10">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Accessories & Power</span>
                <Link to="/products" className="text-primary font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  View Gear <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Personalized "Command Center" Grid */}
      <section className="w-full bg-[#0a110f] border-t border-white/5 py-24 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-10 border-b border-white/10 pb-4">
             <Terminal className="w-5 h-5 text-primary" />
             <h3 className="text-primary font-mono text-xs md:text-sm tracking-widest uppercase">
               {telemetryTitle}
             </h3>
             <span className="ml-auto w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>

          {telemetryLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
               <HeartPulse className="w-6 h-6 animate-pulse text-emerald-500 mr-3" />
               <span className="font-mono text-sm tracking-widest">FETCHING TELEMETRY...</span>
            </div>
          ) : telemetryProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {telemetryProducts.map((prod, idx) => (
                 <Link 
                   to={`/products/${prod.identity?.productId || prod.productId}`} 
                   key={prod.identity?.productId || idx}
                   className="group bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-300"
                 >
                   <div className="h-48 bg-slate-950 overflow-hidden relative">
                      <img 
                        src={prod.core?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop'} 
                        alt={prod.core?.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-60" />
                      <div className="absolute bottom-3 left-3 flex gap-2">
                        <span className="bg-slate-900/80 text-white text-[10px] font-mono px-2 py-1 rounded backdrop-blur-md">
                          {prod.brand?.name || 'GENERIC'}
                        </span>
                      </div>
                   </div>
                   <div className="p-4">
                     <h4 className="text-white text-sm font-bold truncate mb-1 group-hover:text-primary transition-colors">
                       {prod.core?.name}
                     </h4>
                     <div className="flex justify-between items-center mt-3">
                       <span className="text-primary font-mono text-sm font-bold">${prod.pricing?.finalPrice?.toFixed(2)}</span>
                       <LayoutGrid className="w-4 h-4 text-slate-600 group-hover:text-primary transition-colors" />
                     </div>
                   </div>
                 </Link>
               ))}
            </div>
          ) : (
            <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl">
               <span className="text-slate-500 font-mono text-xs">NO TELEMETRY DATA FOUND</span>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-slate-950/40 border-t border-white/5 backdrop-blur-xl z-10 animate-breathe-glow md:text-left text-center">
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 place-items-center md:place-items-start items-start">
          <div className="space-y-4 flex flex-col items-center md:items-start">
            <div className="flex items-center justify-center md:justify-start space-x-3 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 bg-[#0a110f] border border-primary flex items-center justify-center p-1 shrink-0">
                <img src="/cartx-logo.png" alt="CartX Logo" className="w-full h-full object-cover rounded-lg" />
              </div>
              <span className="text-xl md:text-2xl font-extrabold tracking-tight text-white transition-all duration-500">
                Cart<span className="text-primary drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">X</span>
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed font-bold max-w-xs text-center md:text-left">
              State-of-the-art e-commerce orchestration layer, tracking transitions, security states, and conversion pipelines.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-start w-full">
            <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4 pb-1 border-b-2 md:border-b-0 md:border-l-2 border-primary inline-block md:pl-2">Storefront</h4>
            <ul className="space-y-3 text-sm text-slate-300 font-bold flex flex-col items-center md:items-start">
              <li>
                <Link to="/products" className="hover:text-primary transition-all flex items-center justify-center md:justify-start gap-1 hover:-translate-y-0.5 md:hover:-translate-y-0 md:hover:translate-x-1 duration-200 relative group w-max py-0.5">
                  Catalog <ArrowUpRight className="w-3 h-3 text-slate-500" />
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-primary transition-all flex items-center justify-center md:justify-start hover:-translate-y-0.5 md:hover:-translate-y-0 md:hover:translate-x-1 duration-200 relative group w-max py-0.5">
                  Shopping Cart
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col items-center md:items-start w-full">
            <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4 pb-1 border-b-2 md:border-b-0 md:border-l-2 border-primary inline-block md:pl-2">Operations</h4>
            <ul className="space-y-3 text-sm text-slate-300 font-bold flex flex-col items-center md:items-start">
              <li>
                <Link to="/admin" className="hover:text-primary transition-all flex items-center justify-center md:justify-start hover:-translate-y-0.5 md:hover:-translate-y-0 md:hover:translate-x-1 duration-200 relative group w-max py-0.5">
                  Admin Gateway
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </Link>
              </li>
              <li>
                <Link to="/seller/dashboard" className="hover:text-primary transition-all flex items-center justify-center md:justify-start hover:-translate-y-0.5 md:hover:-translate-y-0 md:hover:translate-x-1 duration-200 relative group w-max py-0.5">
                  Seller Center
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </Link>
              </li>
              <li>
                <Link to="/inventory" className="hover:text-primary transition-all flex items-center justify-center md:justify-start hover:-translate-y-0.5 md:hover:-translate-y-0 md:hover:translate-x-1 duration-200 relative group w-max py-0.5">
                  Inventory Overrides
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col items-center md:items-start w-full">
            <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4 pb-1 border-b-2 md:border-b-0 md:border-l-2 border-primary inline-block md:pl-2">Diagnostics</h4>
            <ul className="space-y-3 text-sm text-slate-300 font-bold flex flex-col items-center md:items-start">
              <li>
                <Link to="/health" className="hover:text-primary transition-all flex items-center justify-center md:justify-start gap-1.5 hover:-translate-y-0.5 md:hover:-translate-y-0 md:hover:translate-x-1 duration-200 relative group w-max py-0.5">
                  <HeartPulse className="w-4 h-4 text-emerald-500 animate-pulse" /> System Health
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </Link>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-1.5 text-slate-400"><Terminal className="w-4 h-4" /> API Ver. 1.0.0</li>
              <li className="flex items-center justify-center md:justify-start gap-1.5 text-slate-400"><Globe className="w-4 h-4" /> Region: AP-South</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-center md:justify-between text-sm text-slate-400 font-bold gap-4 text-center md:text-left">
          <p>&copy; {new Date().getFullYear()} Cart<span className="text-primary drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">X</span> Technologies. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center md:justify-end">
            <a href="#" className="hover:text-slate-200 transition-colors relative group py-0.5">
              Privacy Policy
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-slate-300 transition-all duration-300 group-hover:w-full" />
            </a>
            <a href="#" className="hover:text-slate-200 transition-colors relative group py-0.5">
              Terms of Service
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-slate-300 transition-all duration-300 group-hover:w-full" />
            </a>
            <a href="#" className="hover:text-slate-200 transition-colors relative group py-0.5">
              Security Rules
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-slate-400 transition-all duration-300 group-hover:w-full" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

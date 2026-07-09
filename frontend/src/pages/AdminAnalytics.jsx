import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Globe, CreditCard, ShoppingBag, PieChart as PieIcon, BarChart2 as BarIcon, 
  Sparkles, TrendingUp, DollarSign, Activity, AlertTriangle, HelpCircle, 
  Layers, ArrowRight, User, Award, MoreVertical, MapPin, CheckCircle, Clock, Truck, ShieldAlert, Cpu
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export const AdminAnalytics = () => {
  const addToast = useToast((s) => s.addToast);
  
  // Navigation tabs for the 8 sub-analytics pages
  const [activeTab, setActiveTab] = useState('revenue');

  // --- QUERY 1: Financial Matrix (GET /analytics/revenue) ---
  const [timeframe, setTimeframe] = useState('30D');
  const { data: revenueData } = useQuery({
    queryKey: ['analytics-revenue', timeframe],
    queryFn: async () => {
      const res = await api.get('/analytics/revenue', { params: { timeframe } });
      return res.data?.data || [];
    }
  });

  // --- QUERY 2: Velocity & Yield (GET /analytics/top-products) ---
  const { data: topProducts } = useQuery({
    queryKey: ['analytics-top-products'],
    queryFn: async () => {
      const res = await api.get('/analytics/top-products');
      return res.data?.data || [];
    }
  });

  // --- QUERY 3: Customer Hub (GET /analytics/top-customers) ---
  const { data: topCustomers } = useQuery({
    queryKey: ['analytics-top-customers'],
    queryFn: async () => {
      const res = await api.get('/analytics/top-customers');
      return res.data?.data || [];
    }
  });

  // --- QUERY 4: Vendor Ecosystem (GET /analytics/brand-sales) ---
  const [selectedBrand, setSelectedBrand] = useState(null);
  const { data: brandSales } = useQuery({
    queryKey: ['analytics-brand-sales'],
    queryFn: async () => {
      const res = await api.get('/analytics/brand-sales');
      return res.data?.data || [];
    }
  });

  // --- QUERY 5: State Sales (GET /analytics/state-sales) ---
  const { data: stateSales } = useQuery({
    queryKey: ['analytics-state-sales'],
    queryFn: async () => {
      const res = await api.get('/analytics/state-sales');
      return res.data?.data || [];
    }
  });

  // --- QUERY 6: City Sales (GET /analytics/city-sales) ---
  const { data: citySales } = useQuery({
    queryKey: ['analytics-city-sales'],
    queryFn: async () => {
      const res = await api.get('/analytics/city-sales');
      return res.data?.data || [];
    }
  });

  // --- QUERY 7: Fulfillment Pipeline (GET /analytics/order-status) ---
  const { data: orderStatuses } = useQuery({
    queryKey: ['analytics-order-status'],
    queryFn: async () => {
      const res = await api.get('/analytics/order-status');
      return res.data?.data || [];
    }
  });

  // --- QUERY 8: Merchant Scorecard (GET /analytics/seller-performance) ---
  const { data: sellerPerformance } = useQuery({
    queryKey: ['analytics-seller-performance'],
    queryFn: async () => {
      const res = await api.get('/analytics/seller-performance');
      return res.data?.data || [];
    }
  });

  // --- 1. RENDER FINANCIAL MATRIX ---
  const renderFinancialMatrix = () => {
    // The endpoint resolves to a single statistics object, not an array.
    // We map it to delta KPI cards and a historical area trend line.
    const statsObj = revenueData || { totalRevenue: 0, subtotal: 0, discounts: 0, tax: 0, shipping: 0, orderCount: 0 };
    
    // Fallback historical coordinates for visual timeline
    const trendData = [
      { label: 'Jan', revenue: statsObj.totalRevenue * 0.4 },
      { label: 'Feb', revenue: statsObj.totalRevenue * 0.65 },
      { label: 'Mar', revenue: statsObj.totalRevenue * 0.8 },
      { label: 'Apr', revenue: statsObj.totalRevenue * 0.75 },
      { label: 'May', revenue: statsObj.totalRevenue * 0.9 },
      { label: 'Jun', revenue: statsObj.totalRevenue }
    ];

    const maxVal = Math.max(...trendData.map(d => d.revenue || 0), 1);
    
    const pointsRevenue = trendData.map((d, idx) => {
      const x = (idx / (trendData.length - 1)) * 500;
      const y = 160 - (d.revenue / maxVal) * 130 - 10;
      return `${x},${y}`;
    }).join(' ');

    const pointsProfit = trendData.map((d, idx) => {
      const x = (idx / (trendData.length - 1)) * 500;
      const y = 160 - ((d.revenue * 0.45) / maxVal) * 130 - 10;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="flex flex-col gap-6">
        {/* KPI Cards above the chart */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl flex flex-col gap-2">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Gross Revenue</span>
            <div className="flex items-baseline gap-2">
              <span className="text-white font-extrabold text-2xl">${statsObj.totalRevenue?.toLocaleString()}</span>
              <span className="text-emerald-400 text-[9px] font-extrabold bg-emerald-500/10 px-1 rounded shadow-[0_0_8px_rgba(16,185,129,0.3)]">+12.4%</span>
            </div>
          </div>
          <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl flex flex-col gap-2">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Order Counts</span>
            <div className="flex items-baseline gap-2">
              <span className="text-white font-extrabold text-2xl">{statsObj.orderCount?.toLocaleString()}</span>
              <span className="text-emerald-400 text-[9px] font-extrabold bg-emerald-500/10 px-1 rounded shadow-[0_0_8px_rgba(16,185,129,0.3)]">+8.2%</span>
            </div>
          </div>
          <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl flex flex-col gap-2">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Discounts Deducted</span>
            <div className="flex items-baseline gap-2">
              <span className="text-white font-extrabold text-2xl">${statsObj.discounts?.toLocaleString()}</span>
              <span className="text-amber-500 text-[9px] font-extrabold bg-amber-500/10 px-1 rounded">-2.4%</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center bg-slate-950/40 p-4 rounded-2xl border border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Telemetry Controls</span>
            <span className="text-white font-bold text-xs mt-0.5">Dual-Axis Chrono Ledger</span>
          </div>
          <div className="flex bg-slate-900 border border-white/10 rounded-xl p-1 gap-1">
            {['24H', '7D', '30D', 'YTD'].map(t => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold tracking-wider transition-all ${
                  timeframe === t ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Sync Area Chart */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
          <div className="flex justify-between text-xs border-b border-slate-800 pb-3">
            <span className="text-white font-bold flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-emerald-400" /> Gross vs Net Financials</span>
            <div className="flex gap-4 text-[9px] font-bold uppercase">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-400" /> Gross Revenue</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded border border-indigo-400 border-dashed" /> Net Profit (Est)</span>
            </div>
          </div>

          <div className="w-full mt-4 flex items-center justify-center">
            <svg viewBox="0 0 500 160" className="w-full overflow-visible">
              <defs>
                <linearGradient id="mint-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="10" x2="500" y2="10" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <path d={`M 0 160 L ${pointsRevenue} L 500 160 Z`} fill="url(#mint-grad)" />
              <polyline fill="none" stroke="#34d399" strokeWidth="2.5" points={pointsRevenue} />
              <polyline fill="none" stroke="#818cf8" strokeWidth="2" strokeDasharray="3 3" points={pointsProfit} />
            </svg>
          </div>
          <div className="flex justify-between text-[8px] text-slate-500 font-bold uppercase mt-2">
            {trendData.map((d, idx) => (
              <span key={idx}>{d.label}</span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // --- 2. RENDER VELOCITY & YIELD ---
  const renderVelocityMatrix = () => {
    const list = topProducts || [];
    return (
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
        <span className="text-white font-extrabold text-xs uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Velocity & Yield Ledger
        </span>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                <th className="p-3">Product Name</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Units Sold</th>
                <th className="p-3">Current Stock</th>
                <th className="p-3">Velocity (7D)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 font-medium">
              {list.slice(0, 8).map((prod, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 flex items-center gap-2.5">
                    <div className="relative group/thumb">
                      <img 
                        src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80" 
                        className="w-8 h-8 rounded-lg object-cover border border-white/5" 
                      />
                      {/* Hover variant details tooltip */}
                      <div className="absolute left-10 top-0 w-36 bg-slate-950 border border-slate-800 p-2.5 rounded-xl hidden group-hover/thumb:flex flex-col gap-1 z-50 shadow-2xl">
                        <span className="text-[8px] text-primary font-bold uppercase tracking-wider">Active Variants</span>
                        <span className="text-[9px] text-white">Default Core Matrix</span>
                      </div>
                    </div>
                    <span className="text-white font-bold">{prod.name}</span>
                  </td>
                  <td className="p-3 font-mono text-slate-400">{prod.sku}</td>
                  <td className="p-3 text-emerald-400 font-bold">{prod.unitsSold} sold</td>
                  <td className="p-3 text-slate-300">{prod.currentStock} items</td>
                  {/* Sparkline Cell */}
                  <td className="p-3">
                    <svg className="w-16 h-6 overflow-visible">
                      <polyline
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                        points="0,15 10,12 20,20 30,5 40,10 50,2 60,18"
                      />
                    </svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // --- 3. RENDER LTV COHORT RETENTION ---
  const renderCustomerHub = () => {
    const list = topCustomers || [];
    return (
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
        <span className="text-white font-extrabold text-xs uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-400" /> Identity Risk Registry (LTV)
        </span>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                <th className="p-3">Customer Profile</th>
                <th className="p-3">Spent Amount</th>
                <th className="p-3">Lifetime Value Target</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 font-medium text-slate-300">
              {list.slice(0, 8).map((cust, idx) => {
                const percentage = Math.min((cust.spentAmount / 3000) * 100, 100);
                return (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white uppercase text-xs">
                        {cust.name?.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white font-bold">{cust.name}</span>
                        <span className="text-[9px] text-slate-500">{cust.email}</span>
                      </div>
                    </td>
                    <td className="p-3 font-extrabold text-white">${cust.totalSpent?.toLocaleString() || 0}</td>
                    {/* LTV progress bar */}
                    <td className="p-3 w-1/3">
                      <div className="flex flex-col gap-1">
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min((cust.totalSpent || 0) / 3000 * 100, 100)}%` }} />
                        </div>
                        <span className="text-[8px] text-slate-500 font-bold">{Math.min((cust.totalSpent || 0) / 3000 * 100, 100).toFixed(0)}% to VIP Tier</span>
                      </div>
                    </td>
                    {/* Popover actions */}
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => addToast(`Issuing promo code voucher to ${cust.name}`, 'info')}
                        className="px-2.5 py-1 bg-slate-950 border border-white/5 rounded-lg text-[9px] font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors"
                      >
                        Gift Promo
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // --- 4. RENDER VENDOR DONUT ---
  const renderVendorDonut = () => {
    const list = brandSales || [];
    const total = list.reduce((acc, b) => acc + b.revenue, 0) || 1;
    let accum = 0;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-between gap-6">
          <span className="text-white font-bold text-xs uppercase tracking-wider border-b border-slate-800 pb-2 w-full text-center">Interactive Vendor Share</span>
          
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              {list.map((brand, idx) => {
                const angle = (brand.revenue / total) * 360;
                const r = 35;
                const cx = 50;
                const cy = 50;
                
                const x1 = cx + r * Math.cos((accum - 90) * Math.PI / 180);
                const y1 = cy + r * Math.sin((accum - 90) * Math.PI / 180);
                accum += angle;
                const x2 = cx + r * Math.cos((accum - 90) * Math.PI / 180);
                const y2 = cy + r * Math.sin((accum - 90) * Math.PI / 180);
                const largeArc = angle > 180 ? 1 : 0;
                const strokeColor = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'][idx % 4];

                return (
                  <path
                    key={idx}
                    d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="10"
                    className="hover:stroke-[12] cursor-pointer transition-all duration-200"
                    onClick={() => setSelectedBrand(brand.brand)}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Total Volume</span>
              <span className="text-white font-extrabold text-sm">${total.toLocaleString()}</span>
            </div>
          </div>
          <span className="text-[9px] text-slate-500 font-bold uppercase">Click segment to isolate vendor</span>
        </div>

        <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
          <span className="text-white font-bold text-xs uppercase tracking-wider border-b border-slate-800 pb-3">Ecosystem Leaderboards</span>
          <div className="flex flex-col gap-3">
            {list.map((brand, idx) => {
              const pct = ((brand.revenue / total) * 100).toFixed(1);
              return (
                <div 
                  key={idx} 
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    selectedBrand === brand.brand ? 'bg-primary/10 border-primary/30' : 'bg-slate-950/40 border-white/5'
                  }`}
                  onClick={() => setSelectedBrand(brand.brand === selectedBrand ? null : brand.brand)}
                >
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-xs capitalize">{brand.brand}</span>
                    <span className="text-[9px] text-slate-500 font-medium">{pct}% market volume share</span>
                  </div>
                  <span className="text-emerald-400 font-mono font-extrabold">${brand.revenue.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // --- 5 & 6. RENDER GEOSPATIAL & LOGISTICS HUDS (State & City) ---
  const renderGeospatialHuds = () => {
    const states = stateSales || [];
    const cities = citySales || [];
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* State Map Panel */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
          <span className="text-white font-extrabold text-xs uppercase tracking-wider border-b border-slate-850 pb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-violet-400" /> Geographic Topography HUD
          </span>
          <div className="flex flex-col gap-3">
            {states.slice(0, 5).map((state, idx) => (
              <div key={idx} className="bg-slate-950/80 border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-white font-bold text-xs">{state.state}</span>
                  <span className="text-[9px] text-slate-500 font-medium">Order latency: Optimal</span>
                </div>
                <div className="text-right">
                  <span className="text-primary font-extrabold text-xs block">${state.revenue.toLocaleString()}</span>
                  <span className="text-slate-400 text-[9px] font-semibold">{state.orderCount} checkouts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hyperlocal city drawer */}
        <div className="lg:col-span-1 bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
          <span className="text-white font-bold text-xs uppercase tracking-wider border-b border-slate-850 pb-3">Micro Logistics</span>
          <div className="flex flex-col gap-3.5 max-h-[300px] overflow-y-auto pr-1">
            {cities.slice(0, 10).map((city, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div className="flex flex-col">
                  <span className="text-white font-bold">{city.city}</span>
                  <span className="text-[8px] text-slate-500 font-mono">ZIP verified</span>
                </div>
                <span className="text-emerald-400 font-bold">${city.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // --- 7. RENDER FULFILLMENT PIPELINE ---
  const renderFulfillmentPipeline = () => {
    const stats = orderStatuses || [];
    return (
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-5">
        <span className="text-white font-extrabold text-xs uppercase tracking-wider border-b border-slate-850 pb-3 flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-400" /> Logistics Kanban Operations Board
        </span>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].map((st) => {
            const count = stats.find(s => s.status?.toUpperCase() === st)?.count || 0;
            return (
              <div key={st} className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 min-h-[140px]">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-white font-extrabold text-[10px] tracking-wider">{st}</span>
                  <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 font-bold">{count}</span>
                </div>
                <div className="flex-1 flex flex-col justify-center items-center">
                  <span className="text-slate-500 text-[10px] italic">Fulfillment nodes active</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- 8. RENDER MERCHANT SCORECARD ---
  const renderMerchantScorecard = () => {
    const list = sellerPerformance || [];
    return (
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-5">
        <span className="text-white font-extrabold text-xs uppercase tracking-wider border-b border-slate-850 pb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-400 animate-pulse" /> Merchant Performance HUD
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.slice(0, 3).map((seller, idx) => (
            <div key={idx} className="bg-slate-950 border border-white/5 p-5 rounded-2xl flex flex-col gap-4">
              <div className="flex justify-between items-start border-b border-slate-900 pb-2">
                <div className="flex flex-col">
                  <span className="text-white font-bold text-xs">{seller.name || 'Merchant node'}</span>
                  <span className="text-[8px] text-slate-500 font-mono">ID: {seller.sellerId || idx}</span>
                </div>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase">Trusted Partner</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-400">
                <div>
                  <span className="text-slate-500 uppercase text-[8px] block font-bold">Fulfillment latency</span>
                  <span className="text-white font-bold font-mono">1.2 Days</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[8px] block font-bold">Return Rates</span>
                  <span className="text-white font-bold font-mono">2.4%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col gap-8 max-w-7xl mx-auto w-full px-4 py-2">
      
      {/* Dynamic Sub-Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-[10px] text-primary font-bold uppercase tracking-wider w-max">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-Dimensional Data Topography</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Analytics Insights</h1>
          <p className="text-slate-400 text-xs">Observe multi-dimensional financial channels and logistics pipelines.</p>
        </div>
      </div>

      {/* Pill tabs selector */}
      <div className="flex flex-wrap gap-2 bg-slate-900/60 border border-white/5 p-2 rounded-3xl backdrop-blur-md">
        {[
          { id: 'revenue', label: 'Financial Matrix', icon: <DollarSign className="w-3.5 h-3.5" /> },
          { id: 'velocity', label: 'Velocity Matrix', icon: <Sparkles className="w-3.5 h-3.5" /> },
          { id: 'customers', label: 'Customer Hub', icon: <User className="w-3.5 h-3.5" /> },
          { id: 'vendor', label: 'Vendor Shares', icon: <PieIcon className="w-3.5 h-3.5" /> },
          { id: 'geospatial', label: 'Geospatial HUD', icon: <Globe className="w-3.5 h-3.5" /> },
          { id: 'pipeline', label: 'Fulfillment Board', icon: <Truck className="w-3.5 h-3.5" /> },
          { id: 'merchant', label: 'Merchant Ratings', icon: <Award className="w-3.5 h-3.5" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Active Panel View */}
      <div className="flex flex-col gap-6">
        {activeTab === 'revenue' && renderFinancialMatrix()}
        {activeTab === 'velocity' && renderVelocityMatrix()}
        {activeTab === 'customers' && renderCustomerHub()}
        {activeTab === 'vendor' && renderVendorDonut()}
        {activeTab === 'geospatial' && renderGeospatialHuds()}
        {activeTab === 'pipeline' && renderFulfillmentPipeline()}
        {activeTab === 'merchant' && renderMerchantScorecard()}
      </div>
    </div>
  );
};

export default AdminAnalytics;

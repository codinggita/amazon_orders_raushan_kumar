import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, ShoppingCart, Percent, Landmark, TrendingUp } from 'lucide-react';
import api from '../services/api';

export const AdminDashboard = () => {
  // Fetch general executive stats
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/analytics/dashboard');
      return res.data?.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">Compiling executive rollup data...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12 glass-panel border border-white/5 rounded-2xl">
        <span className="text-red-400 font-medium text-sm">Failed to connect to analytics dashboard APIs.</span>
      </div>
    );
  }

  const { overall, topProducts, categoryBreakdown, geographicBreakdown } = stats;

  const cardItems = [
    { title: 'Gross Revenue', value: `$${overall.totalRevenue.toLocaleString()}`, change: '+12.4%', icon: <DollarSign className="w-5 h-5 text-emerald-400" />, desc: 'Total sales proceeds' },
    { title: 'Transactional Volume', value: overall.orderCount.toLocaleString(), change: '+8.2%', icon: <ShoppingCart className="w-5 h-5 text-primary" />, desc: 'Successful checkouts count' },
    { title: 'Promo Discounts Deducted', value: `$${overall.discounts.toLocaleString()}`, change: '-2.4%', icon: <Percent className="w-5 h-5 text-amber-400" />, desc: 'Discounted order offsets' },
    { title: 'Tax Collections', value: `$${overall.tax.toLocaleString()}`, change: '+10.1%', icon: <Landmark className="w-5 h-5 text-blue-400" />, desc: 'Aggregated tax rates value' },
  ];

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Executive Dashboard</h1>
        <p className="text-gray-400 text-xs">High-fidelity commerce analytics compiled from 21,629 CSV dataset seeds.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardItems.map((card, idx) => (
          <div key={idx} className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-md">
            <div className="flex justify-between items-start">
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{card.title}</span>
              <div className="p-2 bg-white/5 border border-white/5 rounded-xl">{card.icon}</div>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-extrabold text-2xl tracking-tight mt-2">{card.value}</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-[10px] font-bold ${card.change.startsWith('+') ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {card.change}
                </span>
                <span className="text-gray-500 text-[10px] font-medium">{card.desc}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Performing Products */}
        <div className="lg:col-span-2 glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <span className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Top Performing Products
            </span>
            <span className="text-[10px] text-gray-500">Sorted by Units Sold</span>
          </div>

          <div className="flex flex-col gap-4">
            {topProducts && topProducts.slice(0, 5).map((prod, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-white/5 last:border-0 pb-3 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-gray-500 font-mono w-4">#{idx+1}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-white font-semibold text-xs truncate">{prod.name}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">SKU: {prod.sku}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-white font-bold text-xs block">${prod.revenue.toLocaleString()}</span>
                  <span className="text-gray-500 text-[10px]">{prod.unitsSold} units sold</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic splits */}
        <div className="lg:col-span-1 glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <span className="text-white font-bold text-xs uppercase tracking-wider">Geographic Splits</span>
            <span className="text-[10px] text-gray-500">By Country</span>
          </div>

          <div className="flex flex-col gap-4">
            {geographicBreakdown && geographicBreakdown.slice(0, 5).map((geo, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-white/5 last:border-0 pb-3 last:pb-0 text-xs">
                <div className="flex flex-col min-w-0">
                  <span className="text-white font-semibold truncate">{geo.country}</span>
                  <span className="text-[10px] text-gray-500 mt-0.5">{geo.ordersCount} checkouts</span>
                </div>
                <span className="text-primary font-bold">${geo.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <span className="text-white font-bold text-xs uppercase tracking-wider">Category Sales Performance</span>
          <span className="text-[10px] text-gray-500">Sales Margin Distributions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryBreakdown && categoryBreakdown.map((cat, idx) => (
            <div key={idx} className="bg-black/30 border border-white/5 rounded-xl p-4 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-white font-bold text-xs">{cat.category}</span>
                <span className="text-[10px] text-gray-500 mt-0.5">{cat.unitsSold} items sold</span>
              </div>
              <span className="text-emerald-400 font-extrabold text-xs">${cat.revenue.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

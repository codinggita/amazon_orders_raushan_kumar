import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Globe, CreditCard, ShoppingBag } from 'lucide-react';
import api from '../services/api';

export const AdminAnalytics = () => {
  const [dateFilter, setDateFilter] = useState('');

  // Fetch Payment distributions
  const { data: payments } = useQuery({
    queryKey: ['analytics-payments'],
    queryFn: async () => {
      const res = await api.get('/analytics/payment-distribution');
      return res.data?.data || [];
    }
  });

  // Fetch Category sales
  const { data: categories } = useQuery({
    queryKey: ['analytics-categories'],
    queryFn: async () => {
      const res = await api.get('/analytics/category-sales');
      return res.data?.data || [];
    }
  });

  // Fetch Brand/Seller performance
  const { data: sellers } = useQuery({
    queryKey: ['analytics-sellers'],
    queryFn: async () => {
      const res = await api.get('/analytics/seller-performance');
      return res.data?.data || [];
    }
  });

  // Fetch Country revenue
  const { data: countries } = useQuery({
    queryKey: ['analytics-countries'],
    queryFn: async () => {
      const res = await api.get('/analytics/country-sales');
      return res.data?.data || [];
    }
  });

  // Mock revenue coordinates to simulate Line Chart over the past 6 months
  const revenueTrendData = [
    { label: 'Jan', value: 42000 },
    { label: 'Feb', value: 58000 },
    { label: 'Mar', value: 71000 },
    { label: 'Apr', value: 64000 },
    { label: 'May', value: 89000 },
    { label: 'Jun', value: 104000 }
  ];

  // SVG Line Chart builder parameters
  const chartHeight = 160;
  const chartWidth = 500;
  const maxVal = Math.max(...revenueTrendData.map(d => d.value));
  const points = revenueTrendData.map((d, idx) => {
    const x = (idx / (revenueTrendData.length - 1)) * chartWidth;
    const y = chartHeight - (d.value / maxVal) * (chartHeight - 20) - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Business Intelligence</h1>
        <p className="text-gray-400 text-xs">Granular analysis and distributions of order checkouts and transactions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Line Chart */}
        <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
          <span className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <TrendingUpIcon /> Revenue Trend (Past 6 Months)
          </span>
          <div className="w-full mt-4 flex items-center justify-center">
            {/* SVG Line Graph */}
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full overflow-visible">
              <defs>
                <linearGradient id="line-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Grid Lines */}
              <line x1="0" y1="10" x2={chartWidth} y2="10" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1={chartHeight - 10} x2={chartWidth} y2={chartHeight - 10} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

              {/* Area path */}
              <path
                d={`M 0,${chartHeight} L ${points} L ${chartWidth},${chartHeight} Z`}
                fill="url(#line-grad)"
              />

              {/* Line path */}
              <polyline
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                points={points}
              />

              {/* Data points dots */}
              {revenueTrendData.map((d, idx) => {
                const x = (idx / (revenueTrendData.length - 1)) * chartWidth;
                const y = chartHeight - (d.value / maxVal) * (chartHeight - 20) - 10;
                return (
                  <g key={idx} className="group/dot">
                    <circle cx={x} cy={y} r="3" fill="hsl(var(--primary))" />
                    <circle cx={x} cy={y} r="8" fill="hsl(var(--primary))" className="opacity-0 group-hover/dot:opacity-20 transition-opacity" />
                    <text x={x} y={y - 12} fill="white" fontSize="9" textAnchor="middle" className="opacity-0 group-hover/dot:opacity-100 transition-opacity font-bold">
                      ${d.value.toLocaleString()}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 px-2">
            {revenueTrendData.map((d, idx) => (
              <span key={idx}>{d.label}</span>
            ))}
          </div>
        </div>

        {/* Payment Methods Spread */}
        <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
          <span className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" /> Payment Method Volume (USD)
          </span>

          <div className="flex flex-col gap-4 mt-2">
            {payments && payments.slice(0, 4).map((pay, idx) => {
              const totalAmount = payments.reduce((acc, p) => acc + p.revenue, 0);
              const percentage = ((pay.revenue / totalAmount) * 100).toFixed(1);
              return (
                <div key={idx} className="flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-center text-gray-300">
                    <span className="font-semibold">{pay.paymentMethod.replace('_', ' ')}</span>
                    <span className="font-mono text-gray-400">${pay.revenue.toLocaleString()} ({percentage}%)</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category distribution */}
        <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
          <span className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-primary" /> Sales Volume by Product Category
          </span>

          <div className="flex flex-col gap-4 mt-2">
            {categories && categories.slice(0, 4).map((cat, idx) => {
              const totalUnits = categories.reduce((acc, c) => acc + c.unitsSold, 0);
              const percentage = ((cat.unitsSold / totalUnits) * 100).toFixed(1);
              return (
                <div key={idx} className="flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-center text-gray-300">
                    <span className="font-semibold">{cat.category}</span>
                    <span className="font-mono text-gray-400">{cat.unitsSold} items ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Geographic splits */}
        <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
          <span className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" /> Geographic Sales splits (Global)
          </span>

          <div className="flex flex-col gap-4 mt-2">
            {countries && countries.slice(0, 4).map((geo, idx) => {
              const totalRev = countries.reduce((acc, c) => acc + c.revenue, 0);
              const percentage = ((geo.revenue / totalRev) * 100).toFixed(1);
              return (
                <div key={idx} className="flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-center text-gray-300">
                    <span className="font-semibold">{geo.country}</span>
                    <span className="font-mono text-gray-400">${geo.revenue.toLocaleString()} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal icon component
const TrendingUpIcon = () => (
  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

export default AdminAnalytics;

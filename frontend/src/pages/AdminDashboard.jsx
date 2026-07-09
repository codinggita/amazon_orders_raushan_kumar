import React, { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, ShoppingCart, Percent, Landmark, TrendingUp, Sparkles, MapPin, Layers, Info, BrainCircuit, Globe } from 'lucide-react';
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

  // Simulated SSE Real-time Streaming State
  const [pulseRevenue, setPulseRevenue] = useState(0);
  const [pulseOrders, setPulseOrders] = useState(0);
  const [pulseDiscounts, setPulseDiscounts] = useState(0);
  const [pulseTax, setPulseTax] = useState(0);

  // WebGL 3D Globe Simulator (Canvas-based high-performance spatial view)
  const canvasRef = useRef(null);

  useEffect(() => {
    if (stats) {
      setPulseRevenue(stats.overall.totalRevenue);
      setPulseOrders(stats.overall.orderCount);
      setPulseDiscounts(stats.overall.discounts);
      setPulseTax(stats.overall.tax);
    }
  }, [stats]);

  // Simulate server-pulsed streaming ticks (real-time SSE mock)
  useEffect(() => {
    const interval = setInterval(() => {
      const deltaRevenue = Math.floor(Math.random() * 45) + 5;
      const deltaOrders = Math.random() > 0.7 ? 1 : 0;
      
      setPulseRevenue(prev => prev + deltaRevenue);
      if (deltaOrders > 0) {
        setPulseOrders(prev => prev + deltaOrders);
        setPulseDiscounts(prev => prev + parseFloat((Math.random() * 5).toFixed(2)));
        setPulseTax(prev => prev + parseFloat((deltaRevenue * 0.08).toFixed(2)));
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Directed Graph animation loop inside canvas
  useEffect(() => {
    // Only run when stats are loaded and canvas is in the DOM
    if (isLoading || error || !stats) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let rotationAngle = 0;

    const arcs = [
      { from: { x: 120, y: 110 }, to: { x: 230, y: 70 }, progress: 0, speed: 0.015, color: '#10b981' },
      { from: { x: 80, y: 90 }, to: { x: 190, y: 130 }, progress: 0, speed: 0.02, color: '#3b82f6' },
      { from: { x: 150, y: 50 }, to: { x: 70, y: 120 }, progress: 0, speed: 0.012, color: '#8b5cf6' }
    ];

    const resize = () => {
      if (!canvas.parentNode) return;
      const rect = canvas.parentNode.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = 300;
    };
    resize();
    window.addEventListener('resize', resize);

    const drawGlobe = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = 90;

      // Outer atmosphere halo
      ctx.beginPath();
      const grad = ctx.createRadialGradient(cx, cy, radius - 10, cx, cy, radius + 20);
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.08)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.arc(cx, cy, radius + 20, 0, Math.PI * 2);
      ctx.fill();

      // Base wireframe Sphere
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();

      rotationAngle += 0.003;

      // Draw latitude lines
      for (let i = -3; i <= 3; i++) {
        const offset = (i * radius) / 4;
        const w = Math.sqrt(radius * radius - offset * offset);
        ctx.beginPath();
        ctx.ellipse(cx, cy + offset, w, w * 0.25, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.stroke();
      }

      // Draw rotating longitude lines
      for (let i = 0; i < 6; i++) {
        const angle = rotationAngle + (i * Math.PI) / 6;
        ctx.beginPath();
        ctx.ellipse(cx, cy, radius * Math.abs(Math.sin(angle)), radius, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.stroke();
      }

      // Render Transaction Arcs
      arcs.forEach(arc => {
        arc.progress += arc.speed;
        if (arc.progress > 1) {
          arc.progress = 0;
          arc.to.x = cx + (Math.random() - 0.5) * radius * 1.5;
          arc.to.y = cy + (Math.random() - 0.5) * radius * 1.5;
        }

        const startX = cx + (arc.from.x - 150) * 0.6;
        const startY = cy + (arc.from.y - 100) * 0.6;
        const endX = arc.to.x;
        const endY = arc.to.y;

        const ctrlX = (startX + endX) / 2;
        const ctrlY = Math.min(startY, endY) - 40;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.setLineDash([2, 4]);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]); 

        const t = arc.progress;
        const pulseX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * ctrlX + t * t * endX;
        const pulseY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * ctrlY + t * t * endY;

        ctx.beginPath();
        ctx.arc(pulseX, pulseY, 3, 0, Math.PI * 2);
        ctx.fillStyle = arc.color;
        ctx.shadowColor = arc.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0; 
      });

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SPATIAL TRANSACTION MESH ACTIVE', cx, cy + radius + 35);

      animationId = requestAnimationFrame(drawGlobe);
    };

    drawGlobe();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [isLoading, error, stats]);

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

  const { topProducts, categoryBreakdown, geographicBreakdown } = stats;

  const cardItems = [
    { 
      title: 'Gross Revenue', 
      value: `$${Math.floor(pulseRevenue).toLocaleString()}`, 
      change: '+12.4%', 
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />, 
      desc: 'Total sales proceeds', 
      glow: 'shadow-emerald-500/5 hover:border-emerald-500/30',
      projection: 'M 0 45 Q 35 25, 70 30 T 140 10',
      explainAI: '↑ 12% driven by targeted ad conversion in EU'
    },
    { 
      title: 'Transactional Volume', 
      value: pulseOrders.toLocaleString(), 
      change: '+8.2%', 
      icon: <ShoppingCart className="w-5 h-5 text-sky-400" />, 
      desc: 'Successful checkouts count', 
      glow: 'shadow-sky-500/5 hover:border-sky-500/30',
      projection: 'M 0 40 Q 40 45, 80 20 T 140 15',
      explainAI: '↑ 8% catalog expansions in mobile categories'
    },
    { 
      title: 'Promo Discounts Deducted', 
      value: `$${Math.floor(pulseDiscounts).toLocaleString()}`, 
      change: '-2.4%', 
      icon: <Percent className="w-5 h-5 text-amber-500" />, 
      desc: 'Discounted order offsets', 
      glow: 'shadow-amber-500/5 hover:border-amber-500/30',
      projection: 'M 0 20 Q 30 40, 75 35 T 140 30',
      explainAI: '↓ 2.4% flat adjustments optimization coupon logic'
    },
    { 
      title: 'Tax Collections', 
      value: `$${Math.floor(pulseTax).toLocaleString()}`, 
      change: '+10.1%', 
      icon: <Landmark className="w-5 h-5 text-violet-400" />, 
      desc: 'Aggregated tax rates value', 
      glow: 'shadow-violet-500/5 hover:border-violet-500/30',
      projection: 'M 0 35 Q 35 30, 75 10 T 140 5',
      explainAI: '↑ 10% compliance reporting changes for cross-border trades'
    },
  ];

  return (
    <div className="flex-1 flex flex-col gap-8 max-w-7xl mx-auto w-full px-4 py-2">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-[10px] text-primary font-bold uppercase tracking-wider w-max">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Streaming Ledger Pulse Connected</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Executive Stats</h1>
          <p className="text-slate-400 text-xs">High-fidelity predictive analytics paired with live transaction streams.</p>
        </div>
      </div>

      {/* Hero AI-Forecast Deck Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardItems.map((card, idx) => (
          <div 
            key={idx} 
            className={`glass-panel border border-white/5 rounded-3xl p-6 flex flex-col justify-between gap-4 shadow-lg hover:-translate-y-1 hover:scale-105 hover:shadow-xl transition-all duration-300 ${card.glow} group relative overflow-hidden`}
          >
            <div className="flex justify-between items-start">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{card.title}</span>
              <div className="p-2.5 bg-slate-950/80 border border-white/5 rounded-2xl group-hover:scale-110 transition-transform duration-300 relative z-10">{card.icon}</div>
            </div>
            
            <div className="flex flex-col relative z-10">
              <div className="flex items-baseline gap-2">
                <span className="text-white font-extrabold text-2xl tracking-tight mt-1 animate-pulse">{card.value}</span>
                <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1 rounded">
                  Live
                </span>
              </div>

              {/* Dotted forecast projection line */}
              <div className="h-10 w-full mt-3 opacity-30 group-hover:opacity-60 transition-opacity">
                <svg viewBox="0 0 140 50" className="w-full h-full overflow-visible">
                  <path 
                    d={card.projection} 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeDasharray="2 3"
                    className="text-slate-500" 
                  />
                  <circle cx="140" cy="10" r="2.5" className="fill-primary animate-ping" />
                  <circle cx="140" cy="10" r="2" className="fill-primary" />
                </svg>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-1.5">
                <span className="text-slate-500 text-[10px] font-semibold">{card.desc}</span>
                
                {/* Explainable AI Tooltip hover */}
                <div className="relative group/tooltip">
                  <button className="text-slate-400 hover:text-white transition-colors">
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-6 right-0 w-44 bg-slate-950 border border-slate-800 text-[10px] text-slate-300 rounded-xl p-2.5 hidden group-hover/tooltip:flex flex-col gap-1 shadow-2xl z-50">
                    <span className="text-primary font-bold flex items-center gap-1"><BrainCircuit className="w-3 h-3" /> Explainable AI</span>
                    <span>{card.explainAI}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Dynamic Global Heatmap */}
        <div className="lg:col-span-1 bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-4 hover:border-slate-800 transition-colors">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <span className="text-white font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400 animate-pulse" /> Spatial Transaction Mesh
            </span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase animate-ping">• Live</span>
          </div>

          <div className="w-full bg-slate-950/80 border border-white/5 rounded-2xl overflow-hidden flex items-center justify-center p-2">
            <canvas ref={canvasRef} className="w-full h-[300px] block" />
          </div>
        </div>

        {/* Top Performing Products */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-5 hover:border-slate-800 transition-colors">
          <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
            <span className="text-white font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Top Performing Products
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sorted by Units Sold</span>
          </div>

          <div className="flex flex-col gap-4">
            {topProducts && topProducts.slice(0, 5).map((prod, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-slate-900 last:border-0 pb-3.5 last:pb-0 hover:bg-white/5 px-2 py-1.5 rounded-xl transition-colors">
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="text-xs text-primary font-extrabold font-mono w-4">#{idx+1}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-white font-bold text-xs truncate">{prod.name}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">SKU: {prod.sku}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-white font-extrabold text-xs block">${prod.revenue.toLocaleString()}</span>
                  <span className="text-slate-400 text-[10px] font-semibold">{prod.unitsSold} units sold</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Performance */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-5 hover:border-slate-800 transition-colors">
          <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
            <span className="text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" /> Category Sales Performance
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase">Sales Margin Distributions</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryBreakdown && categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="bg-slate-950/60 border border-white/5 rounded-xl p-4.5 flex justify-between items-center hover:border-slate-800 transition-all hover:scale-[1.02]">
                <div className="flex flex-col">
                  <span className="text-white font-bold text-xs">{cat.category}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 font-medium">{cat.unitsSold} items sold</span>
                </div>
                <span className="text-emerald-400 font-extrabold text-xs">${cat.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic splits */}
        <div className="lg:col-span-1 bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-5 hover:border-slate-800 transition-colors">
          <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
            <span className="text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-accent" /> Geographic Splits
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase">By Country</span>
          </div>

          <div className="flex flex-col gap-4">
            {geographicBreakdown && geographicBreakdown.slice(0, 5).map((geo, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-slate-900 last:border-0 pb-3.5 last:pb-0 hover:bg-white/5 px-2 py-1.5 rounded-xl transition-colors text-xs">
                <div className="flex flex-col min-w-0">
                  <span className="text-white font-bold truncate">{geo.country}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 font-medium">{geo.ordersCount} checkouts</span>
                </div>
                <span className="text-primary font-extrabold">${geo.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

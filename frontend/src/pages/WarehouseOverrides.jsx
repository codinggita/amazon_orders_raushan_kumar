import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Warehouse, CheckCircle2, Sparkles, AlertTriangle, ArrowRight, HelpCircle, X } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export const WarehouseOverrides = () => {
  const queryClient = useQueryClient();
  const addToast = useToast((s) => s.addToast);
  
  const [productId, setProductId] = useState('');
  const [targetStock, setTargetStock] = useState('');

  // Transfer Responsibility Modal states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferDetails, setTransferDetails] = useState({ from: '', to: '', quantity: 50 });

  // Fetch product listings
  const { data: products } = useQuery({
    queryKey: ['warehouse-products-list'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { limit: 50 } });
      return res.data?.data?.docs || [];
    }
  });

  // Fetch specific product stock details
  const { data: stockInfo, isLoading, refetch } = useQuery({
    queryKey: ['warehouse-product-stock', productId],
    queryFn: async () => {
      const res = await api.get(`/inventory/${productId}`);
      return res.data?.data;
    },
    enabled: !!productId
  });

  // Update Inventory Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ prodId, availableStock }) => {
      const res = await api.patch(`/inventory/${prodId}`, { availableStock });
      return res.data?.data;
    },
    onSuccess: () => {
      addToast('Warehouse stock levels successfully overridden.', 'success');
      queryClient.invalidateQueries({ queryKey: ['warehouse-product-stock'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setTargetStock('');
      refetch();
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to update stock levels.', 'error');
    }
  });

  // Simulated Transfer Responsibilities
  const executeTransferMutation = useMutation({
    mutationFn: async () => {
      // Mocked endpoint behavior for logistics overrides
      return new Promise((resolve) => setTimeout(resolve, 800));
    },
    onSuccess: () => {
      addToast(`Rebalancing complete: Transferred ${transferDetails.quantity} orders from ${transferDetails.from} to ${transferDetails.to}`, 'success');
      setShowTransferModal(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!productId || !targetStock) {
      addToast('Please select a product and input target stock value.', 'warning');
      return;
    }

    const stockNum = parseInt(targetStock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      addToast('Please input a valid non-negative number.', 'warning');
      return;
    }

    updateMutation.mutate({ prodId: productId, availableStock: stockNum });
  };

  // Digital Twin Canvas rendering parameters
  const canvasRef = useRef(null);
  const [warehouses, setWarehouses] = useState([
    { id: 'wh_a', label: 'Warehouse A (Berlin)', x: 100, y: 150, capacity: 98, max: 100, fill: '#ef4444' }, // Overflowing
    { id: 'wh_b', label: 'Warehouse B (London)', x: 250, y: 80, capacity: 45, max: 100, fill: '#10b981' }, // Normal
    { id: 'wh_c', label: 'Warehouse C (Paris)', x: 380, y: 160, capacity: 20, max: 100, fill: '#3b82f6' }  // Spare
  ]);
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragTarget, setDragTarget] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const renderTwin = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw logistics connection routes
      ctx.beginPath();
      ctx.moveTo(100, 150);
      ctx.lineTo(250, 80);
      ctx.lineTo(380, 160);
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Render drag-to-reroute path arrow
      if (draggedNode) {
        ctx.beginPath();
        ctx.moveTo(draggedNode.x, draggedNode.y);
        ctx.lineTo(dragTarget.x, dragTarget.y);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]); // Reset

        // Find potential target node
        const hovered = warehouses.find(wh => {
          if (wh.id === draggedNode.id) return false;
          const dx = wh.x - dragTarget.x;
          const dy = wh.y - dragTarget.y;
          return Math.sqrt(dx*dx + dy*dy) < 40;
        });

        if (hovered) {
          ctx.beginPath();
          ctx.arc(hovered.x, hovered.y, 42, 0, Math.PI * 2);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Draw warehouse nodes
      warehouses.forEach(wh => {
        // Overflow expanding effect
        const baseRadius = wh.id === 'wh_a' ? 36 : 28;
        const pulseRatio = wh.id === 'wh_a' ? 1 + Math.sin(Date.now() * 0.005) * 0.05 : 1;
        const radius = baseRadius * pulseRatio;

        ctx.beginPath();
        ctx.arc(wh.x, wh.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = wh.id === 'wh_a' ? '#7f1d1d' : '#0f172a'; // Contrast backing
        ctx.fill();

        ctx.beginPath();
        ctx.arc(wh.x, wh.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = wh.fill;
        ctx.shadowColor = wh.fill;
        ctx.shadowBlur = wh.id === 'wh_a' ? 25 : 8;
        ctx.globalAlpha = 0.8;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;

        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Capacity text label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${wh.capacity}% Cap`, wh.x, wh.y + 3);

        // Name text label above circle
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText(wh.label.split(' ')[0], wh.x, wh.y - radius - 8);
      });

      animationId = requestAnimationFrame(renderTwin);
    };

    renderTwin();
    return () => cancelAnimationFrame(animationId);
  }, [warehouses, draggedNode, dragTarget]);

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const hit = warehouses.find(wh => {
      const dx = wh.x - mx;
      const dy = wh.y - my;
      return Math.sqrt(dx*dx + dy*dy) < 36;
    });

    if (hit) {
      setDraggedNode(hit);
      setDragTarget({ x: mx, y: my });
    }
  };

  const handleMouseMove = (e) => {
    if (!draggedNode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    setDragTarget({ x: mx, y: my });
  };

  const handleMouseUp = () => {
    if (!draggedNode) return;

    // Evaluate rebalancing snapped connection
    const target = warehouses.find(wh => {
      if (wh.id === draggedNode.id) return false;
      const dx = wh.x - dragTarget.x;
      const dy = wh.y - dragTarget.y;
      return Math.sqrt(dx*dx + dy*dy) < 40;
    });

    if (target) {
      setTransferDetails({
        from: draggedNode.label,
        to: target.label,
        quantity: 50
      });
      setShowTransferModal(true);
    }

    setDraggedNode(null);
  };

  return (
    <div className="flex-1 flex flex-col gap-8 max-w-7xl mx-auto w-full px-4 py-2 relative">
      
      {/* Transfer Responsibilities Confirmation Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowTransferModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 animate-bounce" />
              <span className="text-white font-extrabold text-sm uppercase tracking-wider">Confirm Logistics Overrides</span>
            </div>

            <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-300">
              <p>
                You are overriding fulfillment routing parameters from the digital twin map:
              </p>
              <div className="bg-slate-950 border border-white/5 p-4 rounded-2xl flex items-center justify-around gap-2 font-bold font-mono">
                <span className="text-rose-400">{transferDetails.from.split(' ')[0]}</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
                <span className="text-sky-400">{transferDetails.to.split(' ')[0]}</span>
              </div>
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[10px] uppercase font-bold text-slate-400">Transfer Load Limit (orders)</label>
                <input
                  type="number"
                  value={transferDetails.quantity}
                  onChange={(e) => setTransferDetails(prev => ({ ...prev, quantity: e.target.value }))}
                  className="bg-slate-950 border border-white/5 p-3 rounded-xl text-white outline-none focus:border-amber-500 text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <button
                onClick={() => setShowTransferModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3.5 px-4 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => executeTransferMutation.mutate()}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs py-3.5 px-4 rounded-xl transition-all"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-[10px] text-primary font-bold uppercase tracking-wider w-max">
            <Warehouse className="w-3.5 h-3.5" />
            <span>Digital Twin Activated</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Warehouse Overrides</h1>
          <p className="text-slate-400 text-xs">Direct manual stock overrides paired with topological node rebalancing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Digital Twin Map Container */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-4 hover:border-slate-800 transition-colors">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <span className="text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-primary" /> Fulfillment Digital Twin (Logistics HUD)
            </span>
            <span className="text-[10px] text-rose-400 font-bold uppercase animate-pulse">Overflow alert</span>
          </div>

          <div className="w-full bg-slate-950/80 border border-white/5 rounded-2xl overflow-hidden flex items-center justify-center p-2 relative">
            <canvas
              ref={canvasRef}
              width={500}
              height={260}
              className="w-full max-w-[500px] h-[260px] block cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 flex gap-3.5 items-start text-xs text-slate-400">
            <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Topological rebalancing: Drag from <span className="text-rose-400 font-bold">congested Warehouse A (red circle)</span> and drop onto a neighboring center (e.g. Warehouse C) to open the transfer dispatcher.
            </p>
          </div>
        </div>

        {/* Override panel */}
        <div className="lg:col-span-1 glass-panel border border-white/5 rounded-3xl p-6 flex flex-col gap-5">
          <h3 className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/5 pb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Manual Stock Override
          </h3>

          <div className="flex flex-col gap-1.5 text-xs">
            <label className="text-slate-400 font-bold">Select Specimen Product</label>
            <select
              value={productId}
              onChange={(e) => { setProductId(e.target.value); setTargetStock(''); }}
              className="bg-slate-950 border border-white/5 p-3.5 rounded-xl text-white outline-none"
            >
              <option value="">Select product to query...</option>
              {products && products.map((p) => (
                <option key={p.identity.productId} value={p.identity.productId}>
                  {p.core.name} (SKU: {p.identity.sku})
                </option>
              ))}
            </select>
          </div>

          {productId && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 border-t border-white/5 pt-4">
              <div className="flex-grow flex flex-col gap-3 text-xs bg-slate-950 p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active Inventory Data</span>
                {isLoading ? (
                  <span className="text-slate-500 italic">Reading warehouse counters...</span>
                ) : stockInfo ? (
                  <div className="flex justify-between text-white font-bold">
                    <span>Available Stock</span>
                    <span className="text-primary font-mono">{stockInfo.availableStock} items</span>
                  </div>
                ) : (
                  <span className="text-slate-500 italic">No record found.</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5 text-xs">
                <label className="text-slate-400">Override Stock Count (available)</label>
                <input
                  type="number"
                  required
                  value={targetStock}
                  onChange={(e) => setTargetStock(e.target.value)}
                  placeholder="e.g. 150"
                  className="bg-slate-950 border border-white/5 p-3.5 rounded-xl text-white outline-none focus:border-primary/50"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-3.5 rounded-xl text-xs transition-all mt-2"
              >
                Apply Override
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default WarehouseOverrides;

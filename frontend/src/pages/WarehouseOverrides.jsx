import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Warehouse, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export const WarehouseOverrides = () => {
  const queryClient = useQueryClient();
  const addToast = useToast((s) => s.addToast);
  
  const [productId, setProductId] = useState('');
  const [targetStock, setTargetStock] = useState('');

  // Fetch product listings to help select the ID
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

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Warehouse Inventory Overrides</h1>
        <p className="text-gray-400 text-xs">Direct manual stock overrides on database collections.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Selection side */}
        <div className="lg:col-span-1 glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-5">
          <h3 className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/5 pb-3 flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-primary" /> Select Specimen Product
          </h3>

          <div className="flex flex-col gap-1.5 text-xs">
            <label className="text-gray-400">Products Catalog Catalog</label>
            <select
              value={productId}
              onChange={(e) => { setProductId(e.target.value); setTargetStock(''); }}
              className="bg-black/50 border border-white/10 p-3 rounded-lg text-white"
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
              <div className="flex flex-col gap-1.5 text-xs">
                <label className="text-gray-400">Override Stock Count (available)</label>
                <input
                  type="number"
                  value={targetStock}
                  onChange={(e) => setTargetStock(e.target.value)}
                  placeholder="e.g. 250"
                  className="bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/95 text-white font-semibold py-3 rounded-lg text-xs transition-all"
              >
                Submit Warehouse Override
              </button>
            </form>
          )}
        </div>

        {/* Stats view side */}
        <div className="lg:col-span-2 glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-5 justify-between">
          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/5 pb-3">Warehouse Stock Allocation</h3>
            
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-500">Querying inventory databases...</span>
              </div>
            ) : !stockInfo ? (
              <div className="py-16 text-center text-gray-500 text-xs">
                Select a product from the sidebar list to inspect real-time warehouse counts.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
                <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col gap-1">
                  <span className="text-gray-500">Available Stock</span>
                  <span className="text-white font-extrabold text-xl">{stockInfo.availableStock}</span>
                </div>
                <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col gap-1">
                  <span className="text-gray-500">Reserved (Pending orders)</span>
                  <span className="text-amber-400 font-extrabold text-xl">{stockInfo.reservedStock}</span>
                </div>
                <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col gap-1">
                  <span className="text-gray-500">Sold Count</span>
                  <span className="text-emerald-400 font-extrabold text-xl">{stockInfo.soldStock}</span>
                </div>
                <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col gap-1">
                  <span className="text-gray-500">Damaged Stock</span>
                  <span className="text-rose-500 font-extrabold text-xl">{stockInfo.damagedStock}</span>
                </div>
              </div>
            )}
          </div>

          {stockInfo && (
            <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/5 text-[10px] text-gray-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Available status triggers automatically (LOW_STOCK / OUT_OF_STOCK) upon saves.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WarehouseOverrides;

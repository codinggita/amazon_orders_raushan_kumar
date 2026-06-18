import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PackageOpen } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export const SellerDashboard = () => {
  const user = useAuthStore((s) => s.user);
  
  // Use user.userId as the seller ID
  const sellerId = user?.userId || 'brd_apex';

  // Fetch Seller store details & catalog
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['seller-products', sellerId],
    queryFn: async () => {
      const res = await api.get(`/sellers/${sellerId}/products`);
      return res.data?.data || [];
    }
  });

  // Fetch Seller performance telemetry
  const { data: analyticsData } = useQuery({
    queryKey: ['seller-analytics', sellerId],
    queryFn: async () => {
      const res = await api.get(`/sellers/${sellerId}/analytics`);
      return res.data?.data || { totalOrders: 0, totalRevenue: 0, unitsSold: 0 };
    }
  });

  const productsList = productsData || [];
  
  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Merchant Center</h1>
        <p className="text-gray-400 text-xs">Verify your storefront metrics and catalog listings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-3">
          <span className="text-gray-400 text-xs font-semibold uppercase">Total Revenue</span>
          <span className="text-white font-extrabold text-2xl mt-1">
            ${(analyticsData?.totalRevenue || 0).toLocaleString()}
          </span>
        </div>
        <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-3">
          <span className="text-gray-400 text-xs font-semibold uppercase">Units Shipped</span>
          <span className="text-white font-extrabold text-2xl mt-1">
            {(analyticsData?.unitsSold || 0).toLocaleString()} items
          </span>
        </div>
        <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-3">
          <span className="text-gray-400 text-xs font-semibold uppercase">Active Listings</span>
          <span className="text-white font-extrabold text-2xl mt-1">
            {productsList.length} SKUs
          </span>
        </div>
      </div>

      <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
        <h3 className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/5 pb-3">Your Storefront Catalog</h3>
        
        {loadingProducts ? (
          <div className="py-12 flex justify-center">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : productsList.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs flex flex-col items-center gap-2">
            <PackageOpen className="w-10 h-10 text-gray-600" />
            No products associated with your seller profile.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 text-gray-400 uppercase tracking-wider font-semibold">
                  <th className="p-3">Product Name</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock Available</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {productsList.map((p) => (
                  <tr key={p.identity.productId} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 text-white font-semibold">{p.core.name}</td>
                    <td className="p-3 text-gray-400 font-mono">{p.identity.sku}</td>
                    <td className="p-3 text-white font-bold">${p.pricing.finalPrice.toFixed(2)}</td>
                    <td className="p-3 text-gray-300">{p.inventory.availableStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;

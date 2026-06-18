import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShoppingCart, ShieldAlert, TrendingUp } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useToast } from '../components/Toast';
import api from '../services/api';

export const ShopperProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const addToast = useToast((s) => s.addToast);
  const addItem = useCartStore((s) => s.addItem);

  // Fetch Product Specs
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const res = await api.get(`/products/${productId}`);
      return res.data?.data;
    },
    enabled: !!productId
  });

  const handleAddToCart = () => {
    if (product) {
      addItem(product, 1);
      addToast(`${product.core.name} added to cart!`, 'success');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">Loading catalog specifications...</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 animate-bounce" />
        <h3 className="text-white font-bold text-lg">Product not found</h3>
        <p className="text-gray-500 text-xs">The requested product SKU does not exist or has been deleted.</p>
        <button
          onClick={() => navigate('/products')}
          className="bg-primary/20 text-primary font-semibold text-xs py-2 px-4 rounded-lg"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const hasDiscount = product.pricing.discount && product.pricing.discount.value > 0;
  const specKeys = product.core.technicalSpecifications ? Object.keys(product.core.technicalSpecifications) : [];

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div>
        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Catalog
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Product Visual Container */}
        <div className="flex flex-col gap-4">
          <div className="h-96 bg-gradient-to-br from-indigo-950/20 to-black rounded-3xl border border-white/5 flex items-center justify-center relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-radial-gradient" />
            <span className="text-sm text-gray-500 uppercase tracking-widest font-semibold relative z-10 animate-pulse">
              {product.brand.name} SPECIMEN
            </span>
          </div>

          {/* Pricing History Indicator */}
          {product.pricing.pricingHistory && product.pricing.pricingHistory.length > 0 && (
            <div className="glass-panel border border-white/5 rounded-2xl p-4 flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-white text-xs font-semibold">Active Price Tracing Enabled</span>
                <span className="text-gray-400 text-[10px]">
                  Price shifted from ${product.pricing.pricingHistory[0]?.price?.toFixed(2)} to ${product.pricing.finalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Product Specs Detail Panel */}
        <div className="flex flex-col gap-6 justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                {product.category.hierarchy.main}
              </span>
              <span className="px-2.5 py-1 rounded bg-white/5 text-gray-300 text-[10px] font-bold uppercase tracking-wider">
                SKU: {product.identity.sku}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{product.core.name}</h1>
            <span className="text-gray-400 text-sm font-medium">Brand: {product.brand.name} ({product.brand.country || 'Global'})</span>

            <div className="border-t border-white/5 pt-4">
              <h3 className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">Description</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{product.core.shortDescription}</p>
              {product.core.fullDescription && (
                <p className="text-gray-500 text-xs mt-2 leading-relaxed">{product.core.fullDescription}</p>
              )}
            </div>

            {/* Technical Specifications Map */}
            {specKeys.length > 0 && (
              <div className="border-t border-white/5 pt-4">
                <h3 className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-3">Technical Specifications</h3>
                <div className="grid grid-cols-2 gap-2">
                  {specKeys.map((key) => (
                    <div key={key} className="bg-card/40 border border-white/5 rounded-lg p-2 flex items-center justify-between text-xs">
                      <span className="text-gray-500">{key}</span>
                      <span className="text-white font-medium">{product.core.technicalSpecifications[key]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dimensions and Weights */}
            {product.core.dimensions && (
              <div className="border-t border-white/5 pt-4 flex gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500 text-[10px] uppercase tracking-wider">Dimensions</span>
                  <span className="text-white text-xs font-semibold">
                    {product.core.dimensions.width} x {product.core.dimensions.height} x {product.core.dimensions.depth} {product.core.dimensions.unit}
                  </span>
                </div>
                {product.core.weight && (
                  <div className="flex flex-col gap-1 border-l border-white/10 pl-4">
                    <span className="text-gray-500 text-[10px] uppercase tracking-wider">Weight</span>
                    <span className="text-white text-xs font-semibold">
                      {product.core.weight.value} {product.core.weight.unit}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing & Add to Cart section */}
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Total Price (incl. tax & shipping)</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white font-extrabold text-2xl">${product.pricing.finalPrice.toFixed(2)}</span>
                {hasDiscount && (
                  <span className="text-xs text-rose-400 bg-rose-950/20 px-2 py-0.5 rounded font-bold border border-rose-900/30">
                    -{product.pricing.discount?.value}% OFF
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.inventory.availableStock <= 0}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-40 w-full md:w-auto"
            >
              <ShoppingCart className="w-4 h-4" />
              {product.inventory.availableStock > 0 ? 'Add to Shopping Cart' : 'Out of Stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopperProductDetails;

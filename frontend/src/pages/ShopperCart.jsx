import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, Plus, Minus } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';

export const ShopperCart = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, getTotals } = useCartStore();
  const totals = getTotals();

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-6">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 animate-pulse">
          <ShoppingBag className="w-8 h-8 text-gray-500" />
        </div>
        <h2 className="text-white font-extrabold text-xl">Your Cart is Empty</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          Explore the catalog to add items before checking out.
        </p>
        <Link
          to="/products"
          className="bg-primary hover:bg-primary/95 text-white font-semibold text-xs py-3 px-6 rounded-xl transition-all"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-white tracking-tight">Your Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items list */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {items.map((item) => {
            const product = item.product;
            return (
              <div
                key={product.identity.productId}
                className="glass-panel border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:border-white/10 transition-colors"
              >
                {/* Product spec block icon */}
                <div className="w-20 h-20 bg-black/60 rounded-xl border border-white/5 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">{product.brand.name}</span>
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{product.brand.name}</span>
                  <Link to={`/products/${product.identity.productId}`} className="text-white font-bold text-sm hover:underline line-clamp-1">
                    {product.core.name}
                  </Link>
                  <span className="text-xs text-gray-500 line-clamp-1 mt-0.5">{product.core.shortDescription}</span>
                  <span className="text-white font-semibold text-xs mt-2">${product.pricing.finalPrice.toFixed(2)} / unit</span>
                </div>

                {/* Quantity adjusters */}
                <div className="flex items-center gap-2 bg-black/45 border border-white/5 rounded-lg p-1.5">
                  <button
                    onClick={() => updateQuantity(product.identity.productId, item.quantity - 1)}
                    className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-white text-xs font-semibold px-2 w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(product.identity.productId, item.quantity + 1)}
                    className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => removeItem(product.identity.productId)}
                  className="p-2.5 text-gray-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl border border-transparent hover:border-rose-900/30 transition-all"
                  title="Remove Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          <div>
            <Link to="/products" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mt-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
            </Link>
          </div>
        </div>

        {/* Totals panel */}
        <div className="lg:col-span-1">
          <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-6 sticky top-24">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider border-b border-white/5 pb-3">Cart Invoice Summary</h3>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Subtotal Amount</span>
                <span className="text-white font-medium">${totals.subtotal.toFixed(2)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-xs text-emerald-400">
                  <span>Discounts Applied</span>
                  <span>-${totals.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Tax Estimation (VAT/GST)</span>
                <span className="text-white font-medium">${totals.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Shipping Costs</span>
                <span className="text-white font-medium">${totals.shipping.toFixed(2)}</span>
              </div>
              <div className="border-t border-white/5 pt-3 mt-1 flex justify-between text-sm font-bold">
                <span className="text-white">Total Bill</span>
                <span className="text-primary">${totals.total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98]"
            >
              Checkout Invoice
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopperCart;

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/Toast';
import api from '../services/api';
import { ShieldCheck, CreditCard, Phone, MapPin, ArrowLeft } from 'lucide-react';

const checkoutSchema = zod.object({
  phone: zod.string().min(10, 'Please enter a valid phone number (min 10 digits).'),
  paymentMethod: zod.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'STRIPE', 'NET_BANKING', 'COD']),
  shippingAddress: zod.object({
    street: zod.string().min(1, 'Street address is required.'),
    city: zod.string().min(1, 'City is required.'),
    state: zod.string().min(1, 'State is required.'),
    zip: zod.string().min(1, 'Zip/Postal code is required.'),
    country: zod.string().min(1, 'Country is required.'),
  }),
});

export const ShopperCheckout = () => {
  const navigate = useNavigate();
  const addToast = useToast((s) => s.addToast);
  const user = useAuthStore((s) => s.user);
  const { items, getTotals, clearCart } = useCartStore();
  const totals = getTotals();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      phone: '',
      paymentMethod: 'CREDIT_CARD',
      shippingAddress: {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'United States',
      }
    }
  });

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-6">
        <h2 className="text-white font-extrabold text-xl">Authentication Required</h2>
        <p className="text-gray-500 text-sm max-w-xs">You must sign in to finalize checkout checkout orders.</p>
        <Link to="/login" className="bg-primary hover:bg-primary/95 text-white font-semibold text-xs py-3 px-6 rounded-xl">
          Log In
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-6">
        <h2 className="text-white font-extrabold text-xl">Cart is Empty</h2>
        <Link to="/products" className="bg-primary hover:bg-primary/95 text-white font-semibold text-xs py-3 px-6 rounded-xl">
          Browse Products
        </Link>
      </div>
    );
  }

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        phone: data.phone,
        paymentMethod: data.paymentMethod,
        shippingAddress: data.shippingAddress,
        products: items.map(item => ({
          productId: item.product.identity.productId,
          quantity: item.quantity
        }))
      };

      const res = await api.post('/orders', payload);
      if (res.data?.success) {
        const order = res.data.data;
        addToast('Order booked successfully!', 'success');
        clearCart();
        navigate(`/my-orders/${order.orderId}`);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Checkout failed. Check stock availability.';
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div>
        <Link to="/cart" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Cart
        </Link>
      </div>

      <h1 className="text-2xl font-extrabold text-white tracking-tight">Transactional Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Billing details form */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-6">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
              <MapPin className="w-4 h-4 text-primary" /> Delivery Logistics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">Phone Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    {...register('phone')}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm outline-none focus:border-primary/50"
                    placeholder="1-800-555-0100"
                  />
                </div>
                {errors.phone && (
                  <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.phone.message}</span>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">Street Address</label>
                <input
                  type="text"
                  {...register('shippingAddress.street')}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-primary/50"
                  placeholder="Main Street Suite 100"
                />
                {errors.shippingAddress?.street && (
                  <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.shippingAddress.street.message}</span>
                )}
              </div>

              <div>
                <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">City</label>
                <input
                  type="text"
                  {...register('shippingAddress.city')}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-primary/50"
                  placeholder="Seattle"
                />
                {errors.shippingAddress?.city && (
                  <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.shippingAddress.city.message}</span>
                )}
              </div>

              <div>
                <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">State / Province</label>
                <input
                  type="text"
                  {...register('shippingAddress.state')}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-primary/50"
                  placeholder="WA"
                />
                {errors.shippingAddress?.state && (
                  <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.shippingAddress.state.message}</span>
                )}
              </div>

              <div>
                <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">Zip / Postal Code</label>
                <input
                  type="text"
                  {...register('shippingAddress.zip')}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-primary/50"
                  placeholder="98101"
                />
                {errors.shippingAddress?.zip && (
                  <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.shippingAddress.zip.message}</span>
                )}
              </div>

              <div>
                <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">Country</label>
                <input
                  type="text"
                  {...register('shippingAddress.country')}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-primary/50"
                  placeholder="United States"
                />
                {errors.shippingAddress?.country && (
                  <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.shippingAddress.country.message}</span>
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
              <CreditCard className="w-4 h-4 text-primary" /> Payment Method
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {[
                { value: 'CREDIT_CARD', label: 'Credit Card' },
                { value: 'DEBIT_CARD', label: 'Debit Card' },
                { value: 'PAYPAL', label: 'PayPal' },
                { value: 'STRIPE', label: 'Stripe' },
                { value: 'NET_BANKING', label: 'Net Banking' },
                { value: 'COD', label: 'Cash on Delivery' },
              ].map((method) => (
                <label
                  key={method.value}
                  className="bg-black/30 border border-white/5 hover:border-white/15 rounded-xl p-4 flex flex-col gap-2 cursor-pointer transition-all relative [&:has(input:checked)]:border-primary [&:has(input:checked)]:bg-primary/5"
                >
                  <input
                    type="radio"
                    value={method.value}
                    {...register('paymentMethod')}
                    className="absolute top-3 right-3 text-primary focus:ring-0 accent-primary"
                  />
                  <span className="text-xs font-bold text-white pr-4">{method.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Checkout Invoice Totals summary panel */}
        <div className="lg:col-span-1">
          <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-6 sticky top-24">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider border-b border-white/5 pb-3">Review Order</h3>

            <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-1">
              {items.map(item => (
                <div key={item.product.identity.productId} className="flex justify-between text-xs py-1 border-b border-white/5 last:border-0">
                  <div className="flex flex-col pr-4 min-w-0">
                    <span className="text-white font-medium line-clamp-1">{item.product.core.name}</span>
                    <span className="text-gray-500 text-[10px]">Qty: {item.quantity}</span>
                  </div>
                  <span className="text-white font-semibold flex-shrink-0">${(item.product.pricing.finalPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2.5 border-t border-white/5 pt-4">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white font-medium">${totals.subtotal.toFixed(2)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-xs text-emerald-400">
                  <span>Discount</span>
                  <span>-${totals.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Tax</span>
                <span className="text-white font-medium">${totals.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Shipping</span>
                <span className="text-white font-medium">${totals.shipping.toFixed(2)}</span>
              </div>
              <div className="border-t border-white/5 pt-3 mt-1 flex justify-between text-sm font-bold">
                <span className="text-white">Amount Due</span>
                <span className="text-primary">${totals.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 text-[10px] text-gray-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Cryptographic trace token will be appended to verify stock reservation safety.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Processing Checkout...' : 'Confirm & Place Order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ShopperCheckout;

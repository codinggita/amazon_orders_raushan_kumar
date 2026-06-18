import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Receipt, Calendar, Eye, CheckCircle2, Circle, Clock, Ban, DollarSign, UserCheck } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export const ShopperOrders = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useToast((s) => s.addToast);
  const [paying, setPaying] = useState(false);

  // Fetch all orders for this shopper (only runs if orderId is not in path)
  const { data: orders, isLoading: loadingList } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const res = await api.get('/orders/my-orders');
      return res.data?.data || [];
    },
    enabled: !orderId
  });

  // Fetch specific order details (runs if orderId is active)
  const { data: order, isLoading: loadingDetails, refetch: refetchOrder } = useQuery({
    queryKey: ['order-details', orderId],
    queryFn: async () => {
      const res = await api.get(`/orders/${orderId}`);
      return res.data?.data;
    },
    enabled: !!orderId
  });

  // Cancel order mutation
  const cancelMutation = useMutation({
    mutationFn: async (note) => {
      const res = await api.post(`/orders/${orderId}/cancel`, { note });
      return res.data?.data;
    },
    onSuccess: () => {
      addToast('Order cancelled and stock reservations released.', 'success');
      refetchOrder();
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to cancel order.', 'error');
    }
  });

  // Payment capture mutation
  const payMutation = useMutation({
    mutationFn: async (transactionId) => {
      const res = await api.post(`/orders/${orderId}/pay`, { transactionId });
      return res.data?.data;
    },
    onSuccess: () => {
      addToast('Payment captured successfully. Order confirmed!', 'success');
      setPaying(false);
      refetchOrder();
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Payment processing failed.', 'error');
      setPaying(false);
    }
  });

  const handleMockPayment = () => {
    setPaying(true);
    // Simulate payment processor response lag
    setTimeout(() => {
      const randomTxn = `txn_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      payMutation.mutate(randomTxn);
    }, 2000);
  };

  const handleCancelOrder = () => {
    if (window.confirm('Are you sure you want to cancel this order? This will release reserved warehouse stocks immediately.')) {
      cancelMutation.mutate('Customer requested checkout cancellation.');
    }
  };

  // Render specific order details
  if (orderId) {
    if (loadingDetails) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Resolving transaction ledger...</span>
        </div>
      );
    }

    if (!order) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-4">
          <Ban className="w-12 h-12 text-rose-500" />
          <h3 className="text-white font-bold text-lg">Order Not Found</h3>
          <Link to="/my-orders" className="bg-primary/20 text-primary font-semibold text-xs py-2 px-4 rounded-lg">
            View All Orders
          </Link>
        </div>
      );
    }

    const steps = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
    const currentStepIndex = steps.indexOf(order.status);

    return (
      <div className="flex-1 flex flex-col gap-6 relative">
        {paying && (
          <div className="absolute inset-0 bg-background/85 z-50 flex flex-col items-center justify-center gap-4 backdrop-blur-md rounded-2xl">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-white font-semibold">Simulating Cryptographic Payment Authorization...</span>
            <span className="text-gray-500 text-xs">Communicating with Stripe/PayPal APIs</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link to="/my-orders" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
            Back to Orders History
          </Link>
          <span className="text-xs text-gray-500">Trace ID: <span className="text-gray-300 font-mono">{order.orderId.substring(4, 18)}</span></span>
        </div>

        {/* Status Tracker FSM */}
        <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div>
              <h2 className="text-white font-bold text-sm uppercase tracking-wider">Order Status Timeline</h2>
              <p className="text-gray-500 text-[10px] mt-0.5">FSM State: <span className="text-primary font-mono font-bold">{order.status}</span></p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              order.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400' :
              order.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-400' :
              order.status === 'REFUNDED' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-primary/10 text-primary'
            }`}>
              {order.status}
            </span>
          </div>

          {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative mt-2">
              {steps.map((step, idx) => {
                const isActive = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step} className="flex flex-col gap-2 relative">
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <CheckCircle2 className={`w-5 h-5 ${isCurrent ? 'text-primary animate-pulse' : 'text-emerald-500'}`} />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-600" />
                      )}
                      <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-white' : 'text-gray-500'}`}>
                        {step}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 pl-7">
                      {step === 'PENDING' && 'Stock Reserved'}
                      {step === 'CONFIRMED' && 'Payment Verified'}
                      {step === 'SHIPPED' && 'Dispatched / Carrier'}
                      {step === 'DELIVERED' && 'Delivered'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/20 text-rose-300 text-xs">
              This order transaction has been cancelled. Reserved warehouse stock has been returned to active catalog logs.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products & Details */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
              <h3 className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/5 pb-3">Line Items</h3>
              <div className="flex flex-col gap-4">
                {order.products.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 border-b border-white/5 last:border-0 pb-4 last:pb-0">
                    <div className="w-12 h-12 bg-black/60 rounded-lg border border-white/5 flex items-center justify-center flex-shrink-0">
                      <span className="text-[8px] text-gray-500 font-bold uppercase">{item.productSnapshot.brandName}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold text-sm line-clamp-1">{item.productSnapshot.name}</h4>
                      <p className="text-gray-400 text-xs line-clamp-1">{item.productSnapshot.shortDescription}</p>
                      <span className="text-gray-500 text-[10px]">SKU: {item.productSnapshot.sku}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-bold text-sm block">${item.pricingSnapshot.finalPricePerUnit.toFixed(2)}</span>
                      <span className="text-gray-500 text-xs">Qty: {item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Trail Log */}
            {order.auditTrail && order.auditTrail.length > 0 && (
              <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/5 pb-3">Audit Log</h3>
                <div className="flex flex-col gap-4 pl-2">
                  {order.auditTrail.map((audit, idx) => (
                    <div key={idx} className="flex gap-3 relative last:after:hidden after:absolute after:top-6 after:left-2 after:bottom-[-20px] after:w-[1px] after:bg-white/10">
                      <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold text-xs">{audit.status}</span>
                          <span className="text-[10px] text-gray-500">{new Date(audit.changedAt).toLocaleString()}</span>
                        </div>
                        <span className="text-gray-400 text-xs mt-0.5">{audit.note || 'No description provided.'}</span>
                        <span className="text-[10px] text-primary flex items-center gap-1 mt-0.5">
                          <UserCheck className="w-3 h-3" /> Changed By: {audit.changedBy.substring(0, 16)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pricing Ledger summary */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-6">
              <h3 className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/5 pb-3">Invoice Details</h3>
              
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 font-medium">Subtotal Amount</span>
                  <span className="text-white font-medium">${order.analyticsSnapshot.subtotalAmount.toFixed(2)}</span>
                </div>
                {order.analyticsSnapshot.discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-400">
                    <span>Discount Deductions</span>
                    <span>-${order.analyticsSnapshot.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Tax Estimation</span>
                  <span className="text-white font-medium">${order.analyticsSnapshot.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Shipping Costs</span>
                  <span className="text-white font-medium">${order.analyticsSnapshot.shippingAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-white/5 pt-3 mt-1 flex justify-between text-sm font-bold">
                  <span className="text-white">Grand Total</span>
                  <span className="text-primary">${order.analyticsSnapshot.totalRevenue.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 border-t border-white/5 pt-4 text-xs">
                <span className="text-gray-500 text-[10px] uppercase font-semibold">Payment Status</span>
                <span className={`font-semibold mt-1 inline-block ${order.paymentSnapshot.status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {order.paymentSnapshot.status} ({order.paymentSnapshot.method})
                </span>
                {order.paymentSnapshot.transactionId && (
                  <span className="text-gray-500 font-mono text-[9px] mt-0.5">TXN: {order.paymentSnapshot.transactionId}</span>
                )}
              </div>

              {/* Delivery Address Details */}
              <div className="flex flex-col gap-1 border-t border-white/5 pt-4 text-xs">
                <span className="text-gray-500 text-[10px] uppercase font-semibold">Delivery Address</span>
                <span className="text-gray-300 mt-1">{order.shippingSnapshot.address.street}</span>
                <span className="text-gray-400">{order.shippingSnapshot.address.city}, {order.shippingSnapshot.address.state} {order.shippingSnapshot.address.zip}</span>
                <span className="text-gray-400">{order.shippingSnapshot.address.country}</span>
              </div>

              {/* Active Actions */}
              {order.status === 'PENDING' && (
                <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={handleMockPayment}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all"
                  >
                    <DollarSign className="w-4 h-4" /> Pay Invoice Now
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    className="w-full bg-rose-950/20 border border-rose-900/30 text-rose-300 font-semibold py-2 px-4 rounded-xl text-xs hover:bg-rose-950/30 transition-colors"
                  >
                    Cancel Order
                  </button>
                </div>
              )}

              {order.status === 'CONFIRMED' && (
                <button
                  onClick={handleCancelOrder}
                  className="w-full bg-rose-950/20 border border-rose-900/30 text-rose-300 font-semibold py-3 px-4 rounded-xl text-xs hover:bg-rose-950/30 transition-colors border-t border-white/5"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render buyer list of orders
  return (
    <div className="flex-1 flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-white tracking-tight">Your Order History</h1>

      {loadingList ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading checkout history...</span>
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="text-center py-20 glass-panel border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-4">
          <Package className="w-12 h-12 text-gray-600 animate-pulse" />
          <h3 className="text-white font-bold text-lg">No orders recorded</h3>
          <p className="text-gray-500 text-xs">You have not booked any checkouts in this account yet.</p>
          <Link to="/products" className="bg-primary hover:bg-primary/95 text-white font-semibold text-xs py-3 px-6 rounded-xl">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((orderItem) => (
            <div
              key={orderItem.orderId}
              className="glass-panel border border-white/5 hover:border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/5 flex items-center justify-center text-primary flex-shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-white font-bold text-sm">Order: #{orderItem.orderId.substring(4, 16)}</span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(orderItem.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{orderItem.products.length} Products</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                <div className="flex flex-col text-left md:text-right">
                  <span className="text-white font-extrabold text-sm">${orderItem.analyticsSnapshot.totalRevenue.toFixed(2)}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 inline-block ${
                    orderItem.status === 'DELIVERED' ? 'text-emerald-400' :
                    orderItem.status === 'CANCELLED' ? 'bg-transparent text-rose-400' : 'text-primary'
                  }`}>
                    {orderItem.status}
                  </span>
                </div>

                <button
                  onClick={() => navigate(`/my-orders/${orderItem.orderId}`)}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-white transition-all flex items-center gap-2 text-xs font-semibold"
                >
                  <Eye className="w-4 h-4" /> Track Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopperOrders;

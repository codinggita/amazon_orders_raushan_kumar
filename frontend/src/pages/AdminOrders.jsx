import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Filter, Edit, Trash2, X } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export const AdminOrders = () => {
  const queryClient = useQueryClient();
  const addToast = useToast((s) => s.addToast);
  
  // Query Filters
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Selected Order for Edit Overlay
  const [editingOrder, setEditingOrder] = useState(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Fetch paginated system orders
  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status, page],
    queryFn: async () => {
      const res = await api.get('/orders', {
        params: {
          status: status || undefined,
          page,
          limit
        }
      });
      // Backend returns orders inside res.data.data
      return res.data?.data || { docs: [], totalDocs: 0, totalPages: 1 };
    }
  });

  const ordersList = data?.docs || data || [];

  // FSM Transition Status Mutation
  const transitionMutation = useMutation({
    mutationFn: async ({ orderId, status, note }) => {
      const res = await api.patch(`/orders/${orderId}/status`, { status, note });
      return res.data?.data;
    },
    onSuccess: (updated) => {
      addToast(`FSM: Order status transitioned to ${updated.status}`, 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setEditingOrder(null);
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Illegal FSM state transition blocked.', 'error');
    }
  });

  // Shipping details updates mutation
  const updateShippingMutation = useMutation({
    mutationFn: async ({ orderId, payload }) => {
      const res = await api.patch(`/orders/${orderId}`, payload);
      return res.data?.data;
    },
    onSuccess: () => {
      addToast('Order shipping updates saved successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setEditingOrder(null);
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to update shipping fields.', 'error');
    }
  });

  // Soft Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (orderId) => {
      await api.delete(`/orders/${orderId}`);
    },
    onSuccess: () => {
      addToast('Order soft-deleted from active index lists.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to delete order.', 'error');
    }
  });

  const openEditModal = (order) => {
    setEditingOrder(order);
    setTargetStatus(order.status);
    setStatusNote('');
    setCarrier(order.shippingSnapshot.carrier || '');
    setTrackingNumber(order.shippingSnapshot.trackingNumber || '');
  };

  const handleStatusTransitionSubmit = (e) => {
    e.preventDefault();
    if (editingOrder && targetStatus !== editingOrder.status) {
      transitionMutation.mutate({
        orderId: editingOrder.orderId,
        status: targetStatus,
        note: statusNote || 'Staff triggered override.'
      });
    }
  };

  const handleShippingUpdateSubmit = (e) => {
    e.preventDefault();
    if (editingOrder) {
      updateShippingMutation.mutate({
        orderId: editingOrder.orderId,
        payload: { carrier, trackingNumber }
      });
    }
  };

  const handleDelete = (orderId) => {
    if (window.confirm('Soft-delete this order? It will be hidden from shopper and analytics views.')) {
      deleteMutation.mutate(orderId);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Order Management</h1>
          <p className="text-gray-400 text-xs">Dispatch tracking and FSM status transitions controls.</p>
        </div>
      </div>

      {/* Filters HUD */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card/40 border border-white/5 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-black/40 border border-white/5 text-xs text-gray-300 rounded-lg p-2 outline-none cursor-pointer focus:border-primary/50"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>
      </div>

      {/* Orders Ledger List */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading orders ledger...</span>
        </div>
      ) : ordersList.length === 0 ? (
        <div className="text-center py-20 glass-panel border border-white/5 rounded-2xl">
          <Box className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-bold text-sm">No orders mapped</h3>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 glass-panel">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5 text-gray-400 uppercase tracking-wider font-semibold">
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Date</th>
                <th className="p-4">Items</th>
                <th className="p-4">Revenue</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ordersList.map((ord) => (
                <tr key={ord.orderId} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-mono text-gray-300 font-semibold">#{ord.orderId.substring(4, 16)}</td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-white font-semibold">{ord.customerSnapshot.firstName} {ord.customerSnapshot.lastName}</span>
                      <span className="text-[10px] text-gray-500">{ord.customerSnapshot.email}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400">{new Date(ord.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-white font-medium">{ord.products.length} types</td>
                  <td className="p-4 text-white font-bold">${ord.analyticsSnapshot.totalRevenue.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ord.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400' :
                      ord.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-400' : 'bg-primary/10 text-primary'
                    }`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEditModal(ord)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" /> Adjust
                      </button>
                      <button
                        onClick={() => handleDelete(ord.orderId)}
                        className="p-2 bg-rose-950/20 hover:bg-rose-950/30 rounded-lg text-rose-400 hover:text-rose-300 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Editing & FSM Modal Overlay Drawer */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-white/10 rounded-2xl p-6 max-w-lg w-full flex flex-col gap-6 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setEditingOrder(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-white font-bold text-base">Adjust Order: #{editingOrder.orderId.substring(4, 16)}</h2>
              <p className="text-gray-500 text-xs mt-0.5">Admin operations console.</p>
            </div>

            {/* FSM Status Transition Form */}
            <form onSubmit={handleStatusTransitionSubmit} className="flex flex-col gap-4 border-b border-white/5 pb-6">
              <h3 className="text-xs text-primary font-bold uppercase tracking-wider">Transition status machine</h3>
              <div className="flex flex-col gap-1.5 text-xs">
                <label className="text-gray-400">Target FSM Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="bg-black/50 border border-white/10 p-2.5 rounded-lg text-white"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 text-xs">
                <label className="text-gray-400">FSM Audit Note</label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Dispatched via DHL Express"
                  className="bg-black/50 border border-white/10 p-2.5 rounded-lg text-white outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={targetStatus === editingOrder.status}
                className="w-full bg-primary hover:bg-primary/95 text-white font-semibold py-2.5 rounded-lg text-xs transition-all disabled:opacity-40"
              >
                Transition Status
              </button>
            </form>

            {/* Shipping parameters update Form */}
            <form onSubmit={handleShippingUpdateSubmit} className="flex flex-col gap-4">
              <h3 className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Update Carrier & Tracking</h3>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400">Carrier</label>
                  <input
                    type="text"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder="DHL, FEDEX"
                    className="bg-black/50 border border-white/10 p-2.5 rounded-lg text-white outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400">Tracking Number</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="TRK88776655"
                    className="bg-black/50 border border-white/10 p-2.5 rounded-lg text-white outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-lg text-xs transition-all"
              >
                Update Shipping Info
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;

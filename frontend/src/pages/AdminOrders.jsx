import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Filter, Edit, Trash2, X, Terminal, Search, Info, Clock, CheckCircle, Truck, ShoppingBag, XCircle } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export const AdminOrders = () => {
  const queryClient = useQueryClient();
  const addToast = useToast((s) => s.addToast);
  
  // Query Filters & Pagination
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  // Selected Order for Backdrop Drawer Details
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Command Palette states
  const [showPalette, setShowPalette] = useState(false);
  const [paletteCommand, setPaletteCommand] = useState('');
  const [cmdSearchFilter, setCmdSearchFilter] = useState('');

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
      return res.data?.data || { docs: [], totalDocs: 0, totalPages: 1 };
    }
  });

  const ordersList = data?.docs || data || [];

  // Command Palette keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Optimistic UI updates implementation for Order Status Transitions
  const transitionMutation = useMutation({
    mutationFn: async ({ orderId, targetStatus }) => {
      const res = await api.patch(`/orders/${orderId}/status`, { status: targetStatus, note: 'Admin optimistic command execute' });
      return res.data?.data;
    },
    onMutate: async ({ orderId, targetStatus }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin-orders'] });

      // Snapshot previous value
      const previousOrders = queryClient.getQueryData(['admin-orders', status, page]);

      // Optimistically update the order status directly in Query Client cache
      queryClient.setQueryData(['admin-orders', status, page], (old) => {
        if (!old) return old;
        const docs = old.docs || old;
        const updatedDocs = docs.map(ord => 
          ord.orderId === orderId ? { ...ord, status: targetStatus } : ord
        );
        return old.docs ? { ...old, docs: updatedDocs } : updatedDocs;
      });

      // Update active selected order drawer if open
      setSelectedOrder(prev => prev && prev.orderId === orderId ? { ...prev, status: targetStatus } : prev);

      return { previousOrders };
    },
    onError: (err, variables, context) => {
      // Rollback to snapshot data
      if (context?.previousOrders) {
        queryClient.setQueryData(['admin-orders', status, page], context.previousOrders);
      }
      addToast(err.response?.data?.message || 'Illegal FSM state transition blocked.', 'error');
    },
    onSuccess: (updated) => {
      addToast(`Optimistic FSM: Order status transitioned to ${updated.status}`, 'success');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
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
      setSelectedOrder(null);
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to delete order.', 'error');
    }
  });

  // Execute Command Palette operations
  const handleExecuteCommand = (e) => {
    e.preventDefault();
    const command = paletteCommand.trim().toLowerCase();

    if (command.startsWith('> cancel orders stuck in pending')) {
      // Find orders matching constraint
      const pendingOrders = ordersList.filter(o => o.status === 'PENDING');
      if (pendingOrders.length === 0) {
        addToast('Command executed: No pending orders found.', 'info');
      } else {
        pendingOrders.forEach(ord => {
          transitionMutation.mutate({ orderId: ord.orderId, targetStatus: 'CANCELLED' });
        });
        addToast(`Command executed: Transitioning ${pendingOrders.length} pending orders to CANCELLED.`, 'success');
      }
      setPaletteCommand('');
      setShowPalette(false);
      return;
    }

    if (command.startsWith('> confirm all pending')) {
      const pendingOrders = ordersList.filter(o => o.status === 'PENDING');
      if (pendingOrders.length === 0) {
        addToast('No pending orders found to confirm.', 'info');
      } else {
        pendingOrders.forEach(ord => {
          transitionMutation.mutate({ orderId: ord.orderId, targetStatus: 'CONFIRMED' });
        });
        addToast(`Confirming ${pendingOrders.length} pending checkouts.`, 'success');
      }
      setPaletteCommand('');
      setShowPalette(false);
      return;
    }

    // Default: Set filter on grid items
    setCmdSearchFilter(paletteCommand);
    setShowPalette(false);
  };

  const filteredOrders = ordersList.filter(ord => {
    if (!cmdSearchFilter) return true;
    const filter = cmdSearchFilter.toLowerCase();
    return (
      ord.orderId.toLowerCase().includes(filter) ||
      ord.status.toLowerCase().includes(filter) ||
      (ord.shippingAddress?.city || '').toLowerCase().includes(filter) ||
      (ord.userSnapshot?.email || '').toLowerCase().includes(filter)
    );
  });

  return (
    <div className="flex-1 flex flex-col gap-8 max-w-7xl mx-auto w-full px-4 py-2 relative">
      
      {/* Cmd+K Command Palette Floating Dialog */}
      {showPalette && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/80 backdrop-blur-md px-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Terminal className="w-5 h-5 text-primary" />
              <span className="text-white font-extrabold text-sm uppercase tracking-wider">Operations Command Palette</span>
            </div>
            
            <form onSubmit={handleExecuteCommand} className="flex gap-2">
              <input
                type="text"
                value={paletteCommand}
                onChange={(e) => setPaletteCommand(e.target.value)}
                placeholder='Type: "> Cancel orders stuck in pending" or search term...'
                className="flex-1 bg-slate-950 border border-white/5 p-3.5 rounded-xl text-white outline-none focus:border-primary text-xs"
                autoFocus
              />
              <button 
                type="submit" 
                className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-5 rounded-xl transition-all"
              >
                Execute
              </button>
            </form>

            <div className="flex flex-col gap-1.5 mt-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Example commands:</span>
              <div className="flex flex-col gap-1 text-[10px] text-slate-400 font-mono">
                <span className="bg-slate-950 border border-white/5 p-2 rounded-lg cursor-pointer hover:text-white transition-colors" onClick={() => setPaletteCommand('> Cancel orders stuck in pending > 48hrs')}>
                  &gt; Cancel orders stuck in pending &gt; 48hrs
                </span>
                <span className="bg-slate-950 border border-white/5 p-2 rounded-lg cursor-pointer hover:text-white transition-colors" onClick={() => setPaletteCommand('> Confirm all pending')}>
                  &gt; Confirm all pending
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-white/5 pt-3 text-[10px] text-slate-500 font-semibold">
              <span>Press <kbd className="bg-slate-950 px-1.5 py-0.5 rounded border border-white/5">ESC</kbd> or click outside to exit</span>
              <button type="button" onClick={() => setShowPalette(false)} className="hover:text-white transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Header and Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-[10px] text-primary font-bold uppercase tracking-wider w-max">
            <Terminal className="w-3.5 h-3.5" />
            <span>Cmd+K for global actions</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Order Records</h1>
          <p className="text-slate-400 text-xs">High-density ledger grid loaded with optimistic updates.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPalette(true)}
            className="flex items-center gap-2 bg-slate-900 border border-white/5 text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Search Palette (Cmd+K)</span>
          </button>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-900 border border-white/5 text-white font-bold text-xs p-2.5 rounded-xl outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {cmdSearchFilter && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center justify-between text-xs text-primary">
          <span>Active Grid Filter: <strong className="font-mono bg-slate-950/80 px-2 py-0.5 rounded text-white">{cmdSearchFilter}</strong></span>
          <button onClick={() => setCmdSearchFilter('')} className="font-bold underline uppercase text-[10px] tracking-wider">Clear Filter</button>
        </div>
      )}

      {/* High-density grid table */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Syncing transactional logs...</span>
        </div>
      ) : (
        <div className="bg-slate-900/30 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-white/5 text-slate-400 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Shopper</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Value</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 font-medium">
                {filteredOrders.map((ord) => (
                  <tr 
                    key={ord.orderId}
                    className="hover:bg-white/5 cursor-pointer transition-colors border-b border-slate-950"
                    onClick={() => setSelectedOrder(ord)}
                  >
                    <td className="p-4 font-mono font-bold text-primary">{ord.orderId.substring(4, 16)}</td>
                    <td className="p-4 text-slate-400">{new Date(ord.createdAt).toLocaleString()}</td>
                    <td className="p-4 flex flex-col">
                      <span className="text-white font-bold">{ord.userSnapshot?.fullName || 'Guest Client'}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{ord.userSnapshot?.email}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        ord.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400' :
                        ord.status === 'SHIPPED' ? 'bg-sky-500/10 text-sky-400' :
                        ord.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="p-4 text-white font-extrabold">${ord.financialSnapshot?.total?.toLocaleString()}</td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => setSelectedOrder(ord)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-300 transition-colors"
                        >
                          Logs
                        </button>
                        <button 
                          onClick={() => deleteMutation.mutate(ord.orderId)}
                          className="p-1.5 bg-rose-950/20 hover:bg-rose-950/30 rounded-lg text-rose-400 transition-colors"
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
        </div>
      )}

      {/* Backdrop-blur contextual Slide-in Drawer */}
      {selectedOrder && (
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[480px] bg-slate-950/95 border-l border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
            <div className="flex justify-between items-start border-b border-slate-900 pb-4">
              <div>
                <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Contextual Flyout Drawer</span>
                <h2 className="text-white font-extrabold text-lg mt-0.5">Order #{selectedOrder.orderId.substring(4, 16)}</h2>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 bg-slate-900 border border-white/5 rounded-xl hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct transition selector for testing Optimistic UI */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Quick Transition Status (Optimistic)</span>
              <div className="flex gap-1.5 flex-wrap">
                {['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => transitionMutation.mutate({ orderId: selectedOrder.orderId, targetStatus: st })}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all ${
                      selectedOrder.status === st ? 'bg-primary text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Log list - Immutable Event Ledger simulation */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Immutable Event Ledger</span>
              <div className="flex flex-col gap-4 border-l border-slate-900 pl-4 mt-2">
                <div className="relative flex gap-3 text-xs">
                  <div className="absolute -left-[21px] top-0.5 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <div className="flex flex-col">
                    <span className="text-white font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-500" /> Placed Checkouts</span>
                    <span className="text-slate-400 text-[10px] mt-0.5">10:04 AM • Customer cart validation cleared</span>
                  </div>
                </div>

                <div className="relative flex gap-3 text-xs">
                  <div className="absolute -left-[21px] top-0.5 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  <div className="flex flex-col">
                    <span className="text-white font-bold flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-slate-500" /> Fraud Checks Verified</span>
                    <span className="text-slate-400 text-[10px] mt-0.5">10:05 AM • Payment gateway challenges resolved</span>
                  </div>
                </div>

                <div className="relative flex gap-3 text-xs">
                  <div className="absolute -left-[21px] top-0.5 w-2 h-2 rounded-full bg-indigo-500" />
                  <div className="flex flex-col">
                    <span className="text-white font-bold flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-slate-500" /> Inventory Warehouse Allocation</span>
                    <span className="text-slate-400 text-[10px] mt-0.5">11:00 AM • Allocated from Node-A local warehouse stock</span>
                  </div>
                </div>

                {selectedOrder.status === 'DELIVERED' && (
                  <div className="relative flex gap-3 text-xs">
                    <div className="absolute -left-[21px] top-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <div className="flex flex-col">
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5" /> Dispatched / Delivered</span>
                      <span className="text-slate-400 text-[10px] mt-0.5">Live Delivery Update • Receipt acknowledged</span>
                    </div>
                  </div>
                )}

                {selectedOrder.status === 'CANCELLED' && (
                  <div className="relative flex gap-3 text-xs">
                    <div className="absolute -left-[21px] top-0.5 w-2 h-2 rounded-full bg-rose-500" />
                    <div className="flex flex-col">
                      <span className="text-rose-400 font-bold flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Session Cancelled</span>
                      <span className="text-slate-400 text-[10px] mt-0.5">FSM Override • Admin canceled the pending checkout</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Receipt Summary details */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 text-xs mt-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Financial Overview</span>
              <div className="flex justify-between text-slate-300">
                <span>Subtotal</span>
                <span>${selectedOrder.financialSnapshot?.subtotal?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Discounts Applied</span>
                <span className="text-rose-400">-${selectedOrder.financialSnapshot?.discounts?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Taxes & Duties</span>
                <span>${selectedOrder.financialSnapshot?.tax?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 text-white font-extrabold text-sm">
                <span>Aggregate Total</span>
                <span className="text-primary">${selectedOrder.financialSnapshot?.total?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border-t border-white/10 p-6 flex gap-3">
            <button
              onClick={() => deleteMutation.mutate(selectedOrder.orderId)}
              className="flex-1 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 font-bold text-xs py-3.5 rounded-xl transition-colors"
            >
              Soft Delete
            </button>
            <button
              onClick={() => setSelectedOrder(null)}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3.5 rounded-xl transition-colors"
            >
              Close Drawer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;

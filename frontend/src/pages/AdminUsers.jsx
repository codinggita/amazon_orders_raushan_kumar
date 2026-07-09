import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Search, Ban, CheckCircle, ChevronLeft, ChevronRight, Sparkles, ShieldAlert, Cpu, Network, User, HardDrive, Shield } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export const AdminUsers = () => {
  const queryClient = useQueryClient();
  const addToast = useToast((s) => s.addToast);
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Selected User for Identity Resolution Graph Drawer
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch paginated user accounts
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, page],
    queryFn: async () => {
      const res = await api.get('/admin/users', {
        params: {
          search: search || undefined,
          page,
          limit
        }
      });
      return res.data?.data || { docs: [], totalDocs: 0, totalPages: 1 };
    }
  });

  const usersList = data?.docs || data || [];
  const totalPages = data?.totalPages || 1;

  // Block User Mutation
  const blockMutation = useMutation({
    mutationFn: async (userId) => {
      const res = await api.patch(`/admin/users/${userId}/block`);
      return res.data?.data;
    },
    onSuccess: () => {
      addToast(`Account status updated: User locked.`, 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelectedUser(null);
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to block user account.', 'error');
    }
  });

  // Unblock User Mutation
  const unblockMutation = useMutation({
    mutationFn: async (userId) => {
      const res = await api.patch(`/admin/users/${userId}/unblock`);
      return res.data?.data;
    },
    onSuccess: () => {
      addToast(`Account status updated: User activated.`, 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelectedUser(null);
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to unblock user account.', 'error');
    }
  });

  const handleBlockToggle = (userItem) => {
    if (userItem.accountStatus === 'SUSPENDED') {
      unblockMutation.mutate(userItem.userId);
    } else {
      if (window.confirm(`Are you sure you want to suspend access permissions for ${userItem.firstName} ${userItem.lastName}?`)) {
        blockMutation.mutate(userItem.userId);
      }
    }
  };

  // Render vector representation of associated fraud risks (Identity Resolution Graph)
  const renderIdentityResolution = (userItem) => {
    if (!userItem) return null;

    // Simulate resolved properties from device fingerprints/IP registers
    const accounts = [
      { id: '1', label: `${userItem.firstName} ${userItem.lastName} (Self)`, x: 180, y: 120, r: 24, fill: '#3b82f6', icon: <User className="w-4 h-4 text-white" /> },
      { id: '2', label: 'Linked Card (xx-8899)', x: 80, y: 70, r: 18, fill: '#8b5cf6', icon: <HardDrive className="w-3.5 h-3.5 text-white" /> },
      { id: '3', label: 'Shared IP: 192.168.1.4', x: 280, y: 70, r: 18, fill: '#f59e0b', icon: <Network className="w-3.5 h-3.5 text-white" /> },
      { id: '4', label: 'Flagged Fingerprint: Chrome99', x: 180, y: 220, r: 20, fill: '#ec4899', icon: <Shield className="w-3.5 h-3.5 text-white" /> }
    ];

    const lines = [
      { from: '1', to: '2' },
      { from: '1', to: '3' },
      { from: '1', to: '4' }
    ];

    return (
      <div className="flex flex-col gap-4 mt-2">
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Device Fingerprints & Resolved Nodes</span>
        
        {/* SVG Network Graph mapping Linked devices and IP rings */}
        <div className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 overflow-hidden relative">
          <svg viewBox="0 0 360 260" className="w-full h-[220px] overflow-visible">
            {/* Draw Links */}
            {lines.map((l, idx) => {
              const fromNode = accounts.find(n => n.id === l.from);
              const toNode = accounts.find(n => n.id === l.to);
              if (!fromNode || !toNode) return null;
              return (
                <line
                  key={idx}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="2"
                  strokeDasharray="2 3"
                />
              );
            })}

            {/* Draw Nodes */}
            {accounts.map((node) => (
              <g key={node.id} className="cursor-pointer group">
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r}
                  fill={node.fill}
                  className="transition-all duration-300 group-hover:scale-105"
                />
                <text
                  x={node.x}
                  y={node.y + node.r + 14}
                  fill="#94a3b8"
                  fontSize="8.5"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="fill-slate-400 group-hover:fill-white transition-colors"
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col gap-8 max-w-7xl mx-auto w-full px-4 py-2 relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-[10px] text-primary font-bold uppercase tracking-wider w-max">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Behavioral Clustering</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Security & User Ledger</h1>
          <p className="text-slate-400 text-xs">Review IAM shopper accounts, block/unblock profiles, and inspect device fingerprints.</p>
        </div>
      </div>

      {/* Filters search */}
      <div className="flex items-center gap-3 bg-slate-900/40 border border-white/5 rounded-2xl p-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search credentials by Email, User ID, or Role taxonomy..."
            className="w-full bg-slate-950 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white text-xs outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Users Ledger Table */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading user registries...</span>
        </div>
      ) : usersList.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/30 border border-white/5 rounded-3xl">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-bold text-sm">No profiles found</h3>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-white/5 bg-slate-900/30 shadow-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                <th className="p-4">Profile Name</th>
                <th className="p-4">User ID</th>
                <th className="p-4">Security Role</th>
                <th className="p-4">Account Status</th>
                <th className="p-4">Behavioral Risk Rating</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 font-medium">
              {usersList.map((userItem) => {
                const isHighRisk = userItem.accountStatus === 'SUSPENDED' || userItem.role?.toUpperCase() === 'GUEST';
                const isVIP = userItem.role?.toUpperCase() === 'SUPER_ADMIN' || userItem.role?.toUpperCase() === 'ADMIN';

                return (
                  <tr 
                    key={userItem.userId} 
                    className="hover:bg-white/5 transition-colors border-b border-slate-950 cursor-pointer"
                    onClick={() => setSelectedUser(userItem)}
                  >
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-white font-bold">{userItem.firstName} {userItem.lastName}</span>
                        <span className="text-[10px] text-slate-500">{userItem.email}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-400">{userItem.userId}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[9px] uppercase tracking-wider">
                        {userItem.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        userItem.accountStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                        userItem.accountStatus === 'SUSPENDED' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {userItem.accountStatus}
                      </span>
                    </td>
                    
                    {/* CSS mix-blend-mode: color-dodge Luminescent hardware styling */}
                    <td className="p-4">
                      {isHighRisk && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-extrabold uppercase bg-rose-950/80 text-rose-400 border border-rose-500/30 mix-blend-color-dodge shadow-[0_0_12px_rgba(244,63,94,0.4)]">
                          High Risk Alert
                        </span>
                      )}
                      {isVIP && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-extrabold uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 mix-blend-color-dodge shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                          VIP Admin
                        </span>
                      )}
                      {!isHighRisk && !isVIP && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-extrabold uppercase bg-slate-950 text-slate-400 border border-slate-800">
                          Standard profile
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setSelectedUser(userItem)}
                          className="p-1.5 bg-slate-900 border border-white/5 rounded-lg text-slate-300 text-[10px] px-2.5 font-bold transition-all hover:bg-slate-800"
                        >
                          Clustering
                        </button>
                        {userItem.role !== 'SUPER_ADMIN' && (
                          <button
                            onClick={() => handleBlockToggle(userItem)}
                            className={`p-2 rounded-lg flex items-center gap-1.5 transition-colors ${
                              userItem.accountStatus === 'SUSPENDED'
                                ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 hover:bg-emerald-950/40'
                                : 'bg-rose-950/20 text-rose-400 border border-rose-900/30 hover:bg-rose-950/40'
                            }`}
                          >
                            {userItem.accountStatus === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination HUD */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="p-2 bg-slate-900 hover:bg-white/5 border border-white/5 rounded-xl disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <span className="text-xs text-slate-400 px-3">
            Page <span className="text-white font-semibold">{page}</span> of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="p-2 bg-slate-900 hover:bg-white/5 border border-white/5 rounded-xl disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {/* Contextual Identity Resolution Drawer */}
      {selectedUser && (
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[480px] bg-slate-950/95 border-l border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
            <div className="flex justify-between items-start border-b border-slate-900 pb-4">
              <div>
                <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Identity & Fingerprint Resolver</span>
                <h2 className="text-white font-extrabold text-lg mt-0.5">{selectedUser.firstName} {selectedUser.lastName}</h2>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-1.5 bg-slate-900 border border-white/5 rounded-xl hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Overview */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Metadata Profile</span>
              <div className="flex justify-between text-slate-300">
                <span>E-Mail Address</span>
                <span className="text-white font-semibold">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Database ID</span>
                <span className="font-mono text-slate-400">{selectedUser.userId}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Security Group</span>
                <span className="font-bold text-primary">{selectedUser.role}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Account Status</span>
                <span className={`font-bold ${selectedUser.accountStatus === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedUser.accountStatus}
                </span>
              </div>
            </div>

            {/* Identity Resolution Vector Network Graph */}
            {renderIdentityResolution(selectedUser)}
          </div>

          <div className="bg-slate-950 border-t border-white/10 p-6 flex gap-3">
            {selectedUser.role !== 'SUPER_ADMIN' && (
              <button
                onClick={() => handleBlockToggle(selectedUser)}
                className={`flex-1 font-bold text-xs py-3.5 rounded-xl transition-colors ${
                  selectedUser.accountStatus === 'SUSPENDED'
                    ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30'
                    : 'bg-rose-950/20 text-rose-400 border border-rose-900/30'
                }`}
              >
                {selectedUser.accountStatus === 'SUSPENDED' ? 'Activate Account' : 'Suspend Account'}
              </button>
            )}
            <button
              onClick={() => setSelectedUser(null)}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3.5 rounded-xl transition-colors"
            >
              Close Resolver
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Search, Ban, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export const AdminUsers = () => {
  const queryClient = useQueryClient();
  const addToast = useToast((s) => s.addToast);
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

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
      // Admin users list returned in res.data.data
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

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Security & User Ledger</h1>
        <p className="text-gray-400 text-xs">Review IAM shopper accounts, block/unblock system user profiles, and manage role states.</p>
      </div>

      {/* Filters ledger */}
      <div className="flex items-center gap-3 bg-card/40 border border-white/5 rounded-xl p-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search credentials by Email, User ID, or Role taxonomy..."
            className="w-full bg-black/40 border border-white/5 rounded-lg py-2 pl-9 pr-4 text-white text-xs outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Users ledger Table */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading user registries...</span>
        </div>
      ) : usersList.length === 0 ? (
        <div className="text-center py-20 glass-panel border border-white/5 rounded-2xl">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-bold text-sm">No profiles found</h3>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 glass-panel">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5 text-gray-400 uppercase tracking-wider font-semibold">
                <th className="p-4">Profile Name</th>
                <th className="p-4">User ID</th>
                <th className="p-4">Security Role</th>
                <th className="p-4">Account Status</th>
                <th className="p-4">Date Joined</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {usersList.map((userItem) => (
                <tr key={userItem.userId} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-white font-semibold">{userItem.firstName} {userItem.lastName}</span>
                      <span className="text-[10px] text-gray-500">{userItem.email}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-gray-400">{userItem.userId}</td>
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
                  <td className="p-4 text-gray-500">{userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      {userItem.role !== 'SUPER_ADMIN' ? (
                        <button
                          onClick={() => handleBlockToggle(userItem)}
                          className={`p-2 rounded-lg flex items-center gap-1.5 transition-colors ${
                            userItem.accountStatus === 'SUSPENDED'
                              ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 hover:bg-emerald-950/40'
                              : 'bg-rose-950/20 text-rose-400 border border-rose-900/30 hover:bg-rose-950/40'
                          }`}
                        >
                          {userItem.accountStatus === 'SUSPENDED' ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" /> Activate
                            </>
                          ) : (
                            <>
                              <Ban className="w-3.5 h-3.5" /> Suspend
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-gray-600 text-[10px] uppercase font-semibold">Immutable Root</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination HUD */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="p-2 bg-card/60 hover:bg-white/5 border border-white/5 rounded-xl disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <span className="text-xs text-gray-400 px-3">
            Page <span className="text-white font-semibold">{page}</span> of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="p-2 bg-card/60 hover:bg-white/5 border border-white/5 rounded-xl disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

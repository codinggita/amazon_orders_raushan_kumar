import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tags, Plus, Edit, Trash2, X } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export const AdminCategories = () => {
  const queryClient = useQueryClient();
  const addToast = useToast((s) => s.addToast);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [mainHierarchy, setMainHierarchy] = useState('');

  // Fetch Category taxonomy
  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data?.data || [];
    }
  });

  // Create Category Mutation
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/categories', payload);
      return res.data?.data;
    },
    onSuccess: () => {
      addToast('Taxonomy division branch added successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      closeModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to add category branch.', 'error');
    }
  });

  // Update Category Mutation
  const editMutation = useMutation({
    mutationFn: async ({ categoryId, payload }) => {
      const res = await api.patch(`/categories/${categoryId}`, payload);
      return res.data?.data;
    },
    onSuccess: () => {
      addToast('Category details updated successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      closeModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to update category details.', 'error');
    }
  });

  // Delete Category Mutation
  const deleteMutation = useMutation({
    mutationFn: async (categoryId) => {
      await api.delete(`/categories/${categoryId}`);
    },
    onSuccess: () => {
      addToast('Category division deleted successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to delete category.', 'error');
    }
  });

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setMainHierarchy('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setMainHierarchy(cat.hierarchy.main);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !mainHierarchy) {
      addToast('Category Name and Hierarchy main division are required.', 'warning');
      return;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const payload = {
      categoryId: editingCategory?.categoryId || `cat_${slug}`,
      name,
      slug,
      hierarchy: {
        main: mainHierarchy
      },
      path: [mainHierarchy, name]
    };

    if (editingCategory) {
      editMutation.mutate({ categoryId: editingCategory.categoryId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (categoryId) => {
    if (window.confirm('Delete this category branch? This taxonomy shift impacts listings.')) {
      deleteMutation.mutate(categoryId);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Category Taxonomy</h1>
          <p className="text-gray-400 text-xs">Define division hierarchies for catalog organization.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Add Branch
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Resolving taxonomy hierarchy...</span>
        </div>
      ) : !categories || categories.length === 0 ? (
        <div className="text-center py-20 glass-panel border border-white/5 rounded-2xl">
          <Tags className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-bold text-sm">No categories registered</h3>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 glass-panel">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5 text-gray-400 uppercase tracking-wider font-semibold">
                <th className="p-4">Category Name</th>
                <th className="p-4">Slug Node</th>
                <th className="p-4">Main Division</th>
                <th className="p-4">Recommendation Group</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {categories.map((cat) => (
                <tr key={cat.categoryId} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-white font-semibold">{cat.name}</td>
                  <td className="p-4 font-mono text-gray-400">{cat.slug}</td>
                  <td className="p-4 text-gray-300">{cat.hierarchy.main}</td>
                  <td className="p-4 text-gray-500">{cat.recommendationGroups?.[0] || 'N/A'}</td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.categoryId)}
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

      {/* CRUD Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-white/10 rounded-2xl p-6 max-w-md w-full flex flex-col gap-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-white font-bold text-base">{editingCategory ? 'Update Taxonomy Node' : 'Insert Taxonomy Branch'}</h2>
              <p className="text-gray-500 text-xs mt-0.5">Define Category path settings.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400">Category Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Wireless Earbuds"
                  className="bg-black/50 border border-white/10 p-2.5 rounded-lg text-white outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400">Main Division</label>
                <input
                  type="text"
                  value={mainHierarchy}
                  onChange={(e) => setMainHierarchy(e.target.value)}
                  placeholder="Electronics"
                  className="bg-black/50 border border-white/10 p-2.5 rounded-lg text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/95 text-white font-semibold py-3 rounded-lg text-xs mt-2"
              >
                {editingCategory ? 'Save Adjustments' : 'Add Division Node'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;

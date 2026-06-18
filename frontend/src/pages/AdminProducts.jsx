import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export const AdminProducts = () => {
  const queryClient = useQueryClient();
  const addToast = useToast((s) => s.addToast);
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 8;

  // Modals overlays state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [availableStock, setAvailableStock] = useState('');
  const [mainCategory, setMainCategory] = useState('Electronics');

  // Fetch paginated products catalog
  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, page],
    queryFn: async () => {
      const res = await api.get('/products', {
        params: {
          search: search || undefined,
          page,
          limit
        }
      });
      return res.data?.data || { docs: [], totalDocs: 0, totalPages: 1 };
    }
  });

  const productsList = data?.docs || [];
  const totalPages = data?.totalPages || 1;

  // Add Product Mutation
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/products', payload);
      return res.data?.data;
    },
    onSuccess: () => {
      addToast('Product listing created successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      closeModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to create product listing.', 'error');
    }
  });

  // Edit Product Mutation
  const editMutation = useMutation({
    mutationFn: async ({ productId, payload }) => {
      const res = await api.patch(`/products/${productId}`, payload);
      return res.data?.data;
    },
    onSuccess: () => {
      addToast('Product details updated successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      closeModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to update product details.', 'error');
    }
  });

  // Soft Delete Product Mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId) => {
      await api.delete(`/products/${productId}`);
    },
    onSuccess: () => {
      addToast('Product successfully deleted from catalog listings.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to delete product listing.', 'error');
    }
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setShortDesc('');
    setBasePrice('');
    setAvailableStock('');
    setMainCategory('Electronics');
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setName(product.core.name);
    setSku(product.identity.sku);
    setShortDesc(product.core.shortDescription);
    setBasePrice(product.pricing.basePrice.toString());
    setAvailableStock(product.inventory.availableStock.toString());
    setMainCategory(product.category.hierarchy.main);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !sku || !shortDesc || !basePrice || !availableStock) {
      addToast('All form parameters are required.', 'warning');
      return;
    }

    const priceNum = parseFloat(basePrice);
    const stockNum = parseInt(availableStock, 10);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const payload = {
      identity: {
        productId: editingProduct?.identity.productId || `prod_${Math.random().toString(36).substring(2, 9)}`,
        sku,
        slug
      },
      core: {
        name,
        shortDescription: shortDesc
      },
      category: {
        categoryId: `cat_${mainCategory.toLowerCase()}`,
        hierarchy: { main: mainCategory },
        path: [mainCategory]
      },
      pricing: {
        basePrice: priceNum,
        shippingCost: 5.00
      },
      inventory: {
        availableStock: stockNum,
        reorderThreshold: 10
      }
    };

    if (editingProduct) {
      editMutation.mutate({ productId: editingProduct.identity.productId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (productId) => {
    if (window.confirm('Delete this product from catalog indexes? This soft-delete can be undone.')) {
      deleteMutation.mutate(productId);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Product Catalog</h1>
          <p className="text-gray-400 text-xs">Create, update, and manage catalog database entries.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
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
            placeholder="Filter catalog products by title, SKU, or brand..."
            className="w-full bg-black/40 border border-white/5 rounded-lg py-2 pl-9 pr-4 text-white text-xs outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Catalog Ledger Table */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading catalog indexes...</span>
        </div>
      ) : productsList.length === 0 ? (
        <div className="text-center py-20 glass-panel border border-white/5 rounded-2xl">
          <Box className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-bold text-sm">No products recorded</h3>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 glass-panel">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5 text-gray-400 uppercase tracking-wider font-semibold">
                <th className="p-4">Product Specs</th>
                <th className="p-4">SKU / ID</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Inventory</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {productsList.map((prod) => (
                <tr key={prod.identity.productId} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-white font-semibold">{prod.core.name}</span>
                      <span className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{prod.core.shortDescription}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-gray-400">{prod.identity.sku}</td>
                  <td className="p-4 text-gray-300">{prod.category.hierarchy.main}</td>
                  <td className="p-4 text-white font-bold">${prod.pricing.finalPrice.toFixed(2)}</td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-white font-semibold">{prod.inventory.availableStock} available</span>
                      <span className="text-[9px] text-gray-500 mt-0.5 uppercase tracking-wider">{prod.inventory.inventoryStatus}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEditModal(prod)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(prod.identity.productId)}
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

      {/* CRUD Creation & Update Overlay Modal */}
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
              <h2 className="text-white font-bold text-base">{editingProduct ? 'Adjust Product Listing' : 'Insert Product Spec Listing'}</h2>
              <p className="text-gray-500 text-xs mt-0.5">Define catalog specifications.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400">Product Title</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Apex Wireless Earbuds"
                  className="bg-black/50 border border-white/10 p-2.5 rounded-lg text-white outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400">SKU Code</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="SKU-APX-998877"
                  className="bg-black/50 border border-white/10 p-2.5 rounded-lg text-white outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400">Short Description</label>
                <input
                  type="text"
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  placeholder="Premium ANC wireless earbuds specs."
                  className="bg-black/50 border border-white/10 p-2.5 rounded-lg text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400">Base Price (USD)</label>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="100.00"
                    className="bg-black/50 border border-white/10 p-2.5 rounded-lg text-white outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400">Initial Stock</label>
                  <input
                    type="number"
                    value={availableStock}
                    onChange={(e) => setAvailableStock(e.target.value)}
                    placeholder="100"
                    className="bg-black/50 border border-white/10 p-2.5 rounded-lg text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400">Main Division Taxonomy</label>
                <select
                  value={mainCategory}
                  onChange={(e) => setMainCategory(e.target.value)}
                  className="bg-black/50 border border-white/10 p-2.5 rounded-lg text-white"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Computers">Computers</option>
                  <option value="Home & Kitchen">Home & Kitchen</option>
                  <option value="Books">Books</option>
                  <option value="Fashion">Fashion</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/95 text-white font-semibold py-3 rounded-lg text-xs mt-2"
              >
                {editingProduct ? 'Save Adjustments' : 'Create Spec Listing'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;

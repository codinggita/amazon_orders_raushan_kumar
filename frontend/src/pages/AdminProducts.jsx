import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, X, Sparkles, Check, RefreshCw, Layers } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export const AdminProducts = () => {
  const queryClient = useQueryClient();
  const addToast = useToast((s) => s.addToast);
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Inline Cell Editing States (spreadsheet mode)
  const [editingCell, setEditingCell] = useState(null); // format: { productId: string, field: 'price' | 'stock' }
  const [cellValue, setCellValue] = useState('');

  // 3D variant viewer states (mock)
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [rotationAngle, setRotationAngle] = useState(0);

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

  // Inline edit mutation (Excel Spreadsheet Mode)
  const inlineUpdateMutation = useMutation({
    mutationFn: async ({ productId, payload }) => {
      const res = await api.patch(`/products/${productId}`, payload);
      return res.data?.data;
    },
    onSuccess: () => {
      addToast('Cell edit saved to matrix database.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setEditingCell(null);
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to update catalog matrix.', 'error');
    }
  });

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

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setName(prod.core.name);
    setSku(prod.identity.sku);
    setShortDesc(prod.core.shortDescription || '');
    setBasePrice(prod.pricing.basePrice);
    setAvailableStock(prod.inventory.availableStock);
    setMainCategory(prod.category.hierarchy.main);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleInlineSubmit = (productId, field) => {
    const value = parseFloat(cellValue);
    if (isNaN(value)) {
      addToast('Please enter a valid numeric value.', 'error');
      return;
    }

    const payload = field === 'price' 
      ? { pricing: { basePrice: value, finalPrice: value } }
      : { inventory: { availableStock: Math.floor(value) } };

    inlineUpdateMutation.mutate({ productId, payload });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const payload = {
      core: {
        name,
        shortDescription: shortDesc
      },
      identity: {
        sku
      },
      category: {
        hierarchy: {
          main: mainCategory
        }
      },
      pricing: {
        basePrice: parseFloat(basePrice),
        finalPrice: parseFloat(basePrice)
      },
      inventory: {
        availableStock: parseInt(availableStock),
        inventoryStatus: parseInt(availableStock) > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
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

  // Simulate 3D rotation steps on image hover
  React.useEffect(() => {
    if (!hoveredProduct) return;
    const interval = setInterval(() => {
      setRotationAngle(prev => (prev + 15) % 360);
    }, 120);
    return () => clearInterval(interval);
  }, [hoveredProduct]);

  return (
    <div className="flex-1 flex flex-col gap-8 max-w-7xl mx-auto w-full px-4 py-2">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-[10px] text-primary font-bold uppercase tracking-wider w-max">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Omnichannel Asset Hub</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Product Catalog</h1>
          <p className="text-slate-400 text-xs">Spreadsheet editing matrix for batch-updating pricing and stock.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white font-bold text-xs py-3.5 px-5 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
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
            placeholder="Filter catalog products by title, SKU, or category..."
            className="w-full bg-slate-950 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white text-xs outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Table view */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading catalog indexes...</span>
        </div>
      ) : productsList.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/30 border border-white/5 rounded-3xl">
          <Box className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-bold text-sm">No products recorded</h3>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-white/5 bg-slate-900/30 shadow-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                <th className="p-4 w-12">Preview</th>
                <th className="p-4">Product Specs</th>
                <th className="p-4">SKU Code</th>
                <th className="p-4">Category</th>
                <th className="p-4">Pricing Matrix</th>
                <th className="p-4">Available Stock</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 font-medium">
              {productsList.map((prod) => {
                const isHovered = hoveredProduct === prod.identity.productId;
                const images = prod.core.images || [];
                const previewImg = images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100';

                return (
                  <tr key={prod.identity.productId} className="hover:bg-white/5 transition-colors border-b border-slate-950">
                    {/* 3D Asset & Variant Inspector Preview */}
                    <td className="p-4">
                      <div 
                        className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-950 border border-white/5 cursor-pointer flex items-center justify-center"
                        onMouseEnter={() => setHoveredProduct(prod.identity.productId)}
                        onMouseLeave={() => setHoveredProduct(null)}
                      >
                        <img 
                          src={previewImg} 
                          alt={prod.core.name}
                          className="w-full h-full object-cover transition-transform duration-300"
                          style={{
                            transform: isHovered ? `rotateY(${rotationAngle}deg) scale(1.15)` : 'none',
                            transformStyle: 'preserve-3d'
                          }}
                        />
                        {isHovered && (
                          <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="text-[7px] text-white font-extrabold uppercase bg-slate-950 px-1 py-0.5 rounded shadow">360°</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-white font-bold">{prod.core.name}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{prod.core.shortDescription}</span>
                      </div>
                    </td>
                    
                    <td className="p-4 font-mono text-slate-400">{prod.identity.sku}</td>
                    
                    <td className="p-4 text-slate-300">{prod.category.hierarchy.main}</td>

                    {/* Inline Price Edit Cell */}
                    <td className="p-4">
                      {editingCell && editingCell.productId === prod.identity.productId && editingCell.field === 'price' ? (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={cellValue}
                            onChange={(e) => setCellValue(e.target.value)}
                            className="w-16 bg-slate-950 border border-primary p-1 rounded text-white text-[11px] outline-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleInlineSubmit(prod.identity.productId, 'price');
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            autoFocus
                          />
                          <button onClick={() => handleInlineSubmit(prod.identity.productId, 'price')} className="p-1 bg-emerald-500/10 text-emerald-400 rounded"><Check className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <div 
                          className="text-white font-extrabold cursor-pointer hover:bg-white/5 px-2 py-1 rounded w-max border border-transparent hover:border-slate-800 transition-colors"
                          onClick={() => {
                            setEditingCell({ productId: prod.identity.productId, field: 'price' });
                            setCellValue(prod.pricing.basePrice);
                          }}
                        >
                          ${prod.pricing.finalPrice.toFixed(2)}
                        </div>
                      )}
                    </td>

                    {/* Inline Stock Edit Cell */}
                    <td className="p-4">
                      {editingCell && editingCell.productId === prod.identity.productId && editingCell.field === 'stock' ? (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={cellValue}
                            onChange={(e) => setCellValue(e.target.value)}
                            className="w-16 bg-slate-950 border border-primary p-1 rounded text-white text-[11px] outline-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleInlineSubmit(prod.identity.productId, 'stock');
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            autoFocus
                          />
                          <button onClick={() => handleInlineSubmit(prod.identity.productId, 'stock')} className="p-1 bg-emerald-500/10 text-emerald-400 rounded"><Check className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <div 
                          className="cursor-pointer hover:bg-white/5 px-2 py-1 rounded w-max border border-transparent hover:border-slate-800 transition-colors"
                          onClick={() => {
                            setEditingCell({ productId: prod.identity.productId, field: 'stock' });
                            setCellValue(prod.inventory.availableStock);
                          }}
                        >
                          <span className="text-white font-bold block">{prod.inventory.availableStock} items</span>
                          <span className="text-[8px] text-slate-500 font-medium uppercase tracking-wider">{prod.inventory.inventoryStatus}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEditModal(prod)}
                          className="p-2 bg-slate-900 border border-white/5 hover:bg-slate-800 rounded-xl text-slate-300 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(prod.identity.productId)}
                          className="p-2 bg-rose-950/20 hover:bg-rose-950/30 rounded-xl text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legacy editing overlay modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full flex flex-col gap-6 max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-white font-extrabold text-lg">{editingProduct ? 'Edit Catalog Product' : 'Register Catalog Product'}</h2>
              <p className="text-slate-500 text-xs mt-0.5">Adjust settings inside the CMS matrix hierarchy.</p>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 text-xs">
                <label className="text-slate-400">Product Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Earbuds Front View"
                  className="bg-slate-950 border border-white/5 p-3 rounded-xl text-white outline-none focus:border-primary/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. SKU-PHONE-009"
                    className="bg-slate-950 border border-white/5 p-3 rounded-xl text-white outline-none focus:border-primary/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400">Category</label>
                  <select
                    value={mainCategory}
                    onChange={(e) => setMainCategory(e.target.value)}
                    className="bg-slate-950 border border-white/5 p-3 rounded-xl text-white outline-none"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400">Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="bg-slate-950 border border-white/5 p-3 rounded-xl text-white outline-none focus:border-primary/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400">Available Stock</label>
                  <input
                    type="number"
                    required
                    value={availableStock}
                    onChange={(e) => setAvailableStock(e.target.value)}
                    className="bg-slate-950 border border-white/5 p-3 rounded-xl text-white outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-xs">
                <label className="text-slate-400">Short Description</label>
                <textarea
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  rows="3"
                  className="bg-slate-950 border border-white/5 p-3 rounded-xl text-white outline-none focus:border-primary/50 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-3.5 rounded-xl text-xs transition-all mt-2"
              >
                {editingProduct ? 'Save Matrix Specs' : 'Commit Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export const ShopperCatalog = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [page, setPage] = useState(1);
  const limit = 9;

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data?.data || [];
    }
  });

  const { data: productsData, isLoading, error, refetch } = useQuery({
    queryKey: ['products', search, selectedCategory, selectedBrand, minPrice, maxPrice, sortBy, page],
    queryFn: async () => {
      let sortParam = '';
      if (sortBy === 'price_asc') sortParam = 'pricing.finalPrice:asc';
      else if (sortBy === 'price_desc') sortParam = 'pricing.finalPrice:desc';
      else sortParam = 'search.popularityScore:desc';

      const res = await api.get('/products', {
        params: {
          search: search || undefined,
          category: selectedCategory || undefined,
          brand: selectedBrand || undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          sort: sortParam,
          page,
          limit
        }
      });
      return res.data?.data || { docs: [], totalDocs: 0, totalPages: 1 };
    }
  });

  const productsList = productsData?.docs || [];
  const totalPages = productsData?.totalPages || 1;
  const categories = categoriesData || [];

  const brands = ['Apex Audio', 'Apex Computers', 'Global', 'Germany', 'USA'];

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('popularity');
    setPage(1);
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-2xl glass-panel p-8 md:p-12 border border-white/5 flex flex-col items-center justify-center text-center gap-4">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-indigo-500/10 pointer-events-none" />
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3 h-3" /> Intelligence Catalog Discovery
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Explore Our Commerce Engine</h1>
        <p className="text-gray-400 text-sm max-w-lg">
          Zero-latency searches, dynamic filtering adjustments, and live inventory sync queries directly to MongoDB.
        </p>

        <div className="relative w-full max-w-xl mt-2">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search products by title, keywords, or SKU codes..."
            className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none shadow-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="font-semibold text-white text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" /> Filter Options
              </span>
              <button
                onClick={handleResetFilters}
                className="text-xs text-primary hover:underline font-medium"
              >
                Reset All
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-gray-300 text-xs font-semibold uppercase tracking-wider">Category Taxonomy</label>
              <div className="flex flex-col gap-1.5 mt-1">
                <button
                  onClick={() => { setSelectedCategory(''); setPage(1); }}
                  className={`text-left text-xs py-2 px-3 rounded-lg transition-colors ${!selectedCategory ? 'bg-primary/20 text-white font-semibold' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.categoryId}
                    onClick={() => { setSelectedCategory(cat.categoryId); setPage(1); }}
                    className={`text-left text-xs py-2 px-3 rounded-lg transition-colors ${selectedCategory === cat.categoryId ? 'bg-primary/20 text-white font-semibold' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
              <label className="text-gray-300 text-xs font-semibold uppercase tracking-wider">Brand Manufacturer</label>
              <div className="flex flex-col gap-1.5 mt-1">
                <button
                  onClick={() => { setSelectedBrand(''); setPage(1); }}
                  className={`text-left text-xs py-2 px-3 rounded-lg transition-colors ${!selectedBrand ? 'bg-primary/20 text-white font-semibold' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  All Brands
                </button>
                {brands.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => { setSelectedBrand(brand); setPage(1); }}
                    className={`text-left text-xs py-2 px-3 rounded-lg transition-colors ${selectedBrand === brand ? 'bg-primary/20 text-white font-semibold' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
              <label className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">Price Limits (USD)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                  placeholder="Min"
                  className="w-1/2 bg-black/40 border border-white/5 rounded-lg py-2 px-3 text-white text-xs outline-none focus:border-primary/50"
                />
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                  placeholder="Max"
                  className="w-1/2 bg-black/40 border border-white/5 rounded-lg py-2 px-3 text-white text-xs outline-none focus:border-primary/50"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="flex items-center justify-between bg-card/40 border border-white/5 rounded-xl p-4">
            <span className="text-xs text-gray-400">
              Showing <span className="text-white font-medium">{productsList.length}</span> results of page <span className="text-white font-medium">{page}</span>
            </span>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-black/40 border border-white/5 text-xs text-gray-300 rounded-lg p-2 outline-none cursor-pointer focus:border-primary/50"
              >
                <option value="popularity">Popularity Sort</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-panel border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
                  <div className="h-44 w-full bg-white/5 rounded-xl animate-pulse shimmer-bg" />
                  <div className="h-4 w-2/3 bg-white/5 rounded animate-pulse" />
                  <div className="h-3 w-full bg-white/5 rounded animate-pulse" />
                  <div className="h-8 w-1/3 bg-white/5 rounded mt-2 animate-pulse" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 glass-panel border border-white/5 rounded-2xl flex flex-col items-center gap-4">
              <span className="text-red-400 font-medium text-sm">Failed to connect to backend product API endpoints.</span>
              <button
                onClick={() => refetch()}
                className="bg-primary/20 text-primary font-semibold text-xs py-2 px-4 rounded-lg hover:bg-primary/30 transition-colors"
              >
                Retry Request
              </button>
            </div>
          ) : productsList.length === 0 ? (
            <div className="text-center py-20 bg-card/20 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-4">
              <SlidersHorizontal className="w-12 h-12 text-gray-600 animate-bounce" />
              <h3 className="text-white font-bold text-lg">No matches found</h3>
              <p className="text-gray-500 text-xs max-w-xs">
                We couldn't retrieve products matching your queries. Adjust filters or search strings.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {productsList.map((product) => {
                  const hasDiscount = product.pricing.discount && product.pricing.discount.value > 0;
                  return (
                    <div
                      key={product.identity.productId}
                      onClick={() => navigate(`/products/${product.identity.productId}`)}
                      className="group glass-panel border border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col justify-between gap-4 cursor-pointer transition-all shadow-md hover:-translate-y-1 hover:shadow-primary/5"
                    >
                      <div>
                        <div className="h-40 w-full bg-gradient-to-br from-indigo-950/20 to-black rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-radial-gradient group-hover:scale-105 transition-transform duration-500" />
                          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold relative z-10">
                            {product.brand.name}
                          </span>
                          {product.brand.isPremium && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-primary/20 text-[8px] font-bold text-primary border border-primary/20 uppercase tracking-wider">
                              Premium
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex flex-col gap-1">
                          <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                            {product.category.hierarchy.main}
                          </span>
                          <h3 className="text-white font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                            {product.core.name}
                          </h3>
                          <p className="text-gray-400 text-xs line-clamp-2 mt-1">
                            {product.core.shortDescription}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-4">
                        <div className="flex flex-col">
                          {hasDiscount && (
                            <span className="text-[10px] text-gray-500 line-through">
                              ${product.pricing.basePrice.toFixed(2)}
                            </span>
                          )}
                          <span className="text-white font-bold text-sm">
                            ${product.pricing.finalPrice.toFixed(2)}
                          </span>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          product.inventory.inventoryStatus === 'IN_STOCK' ? 'bg-emerald-500/10 text-emerald-400' :
                          product.inventory.inventoryStatus === 'LOW_STOCK' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {product.inventory.inventoryStatus.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-2 bg-card/60 hover:bg-white/5 border border-white/5 rounded-xl disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                  <span className="text-xs text-gray-400 px-3">
                    Page <span className="text-white font-semibold">{page}</span> of {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-2 bg-card/60 hover:bg-white/5 border border-white/5 rounded-xl disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                  >
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default ShopperCatalog;

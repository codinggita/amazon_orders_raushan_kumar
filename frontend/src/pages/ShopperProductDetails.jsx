import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShoppingCart, ShieldAlert, TrendingUp, Sparkles, Box, Info } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useToast } from '../components/Toast';
import api from '../services/api';

export const ShopperProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const addToast = useToast((s) => s.addToast);
  const addItem = useCartStore((s) => s.addItem);

  // Fetch Product Specs
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const res = await api.get(`/products/${productId}`);
      return res.data?.data;
    },
    enabled: !!productId
  });

  const handleAddToCart = () => {
    if (product) {
      addItem(product, 1);
      addToast(`${product.core.name} added to cart!`, 'success');
    }
  };

  const [activeImage, setActiveImage] = React.useState('');

  React.useEffect(() => {
    if (product && product.core.images && product.core.images.length > 0) {
      setActiveImage(product.core.images[0]);
    }
  }, [product]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
        <div className="h-10 w-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Loading catalog specifications...</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 animate-bounce" />
        <h3 className="text-white font-bold text-lg">Product not found</h3>
        <p className="text-gray-500 text-xs">The requested product SKU does not exist or has been deleted.</p>
        <button
          onClick={() => navigate('/products')}
          className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold text-xs py-2 px-4 rounded-lg transition-all"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const hasDiscount = product.pricing.discount && product.pricing.discount.value > 0;
  const specKeys = product.core.technicalSpecifications ? Object.keys(product.core.technicalSpecifications) : [];

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-7xl mx-auto w-full px-4 py-4">
      <Helmet>
        <title>{product.core.name} - CartX</title>
        <meta name="description" content={`Buy ${product.core.name} by ${product.brand?.name || 'CartX'} on CartX. ${(product.core.shortDescription || '').substring(0, 100)}...`} />
        
        {/* Open Graph Tags for Social Media */}
        <meta property="og:title" content={`${product.core.name} - CartX`} />
        <meta property="og:description" content={`Buy ${product.core.name} by ${product.brand?.name || 'us'} on CartX.`} />
        <meta property="og:type" content="product" />
        {product.core.images?.[0] && <meta property="og:image" content={product.core.images[0]} />}
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.core.name} - CartX`} />
        <meta name="twitter:description" content={`Buy ${product.core.name} by ${product.brand?.name || 'us'} on CartX.`} />
        {product.core.images?.[0] && <meta name="twitter:image" content={product.core.images[0]} />}
        
        {/* Google Rich Snippets (JSON-LD) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.core.name,
            "image": product.core.images,
            "description": product.core.shortDescription || "",
            "sku": product.identity.sku,
            "brand": {
              "@type": "Brand",
              "name": product.brand?.name || "CartX"
            },
            "offers": {
              "@type": "Offer",
              "url": `https://cartx.com/products/${product.identity.productId}`,
              "priceCurrency": "USD",
              "price": product.pricing.finalPrice,
              "availability": product.inventory.inStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
            }
          })}
        </script>
      </Helmet>
      <div>
        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-all hover:scale-105"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Catalog
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-4">
        {/* Product Visual Container */}
        <div className="flex flex-col gap-6">
          <div className="relative h-[450px] bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-950 rounded-3xl border border-slate-800/80 flex items-center justify-center overflow-hidden shadow-2xl group">
            <div className="absolute inset-0 bg-radial-gradient" />
            <div className="absolute top-4 left-4 inline-flex items-center gap-1 bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-full text-[10px] text-sky-400 font-semibold backdrop-blur-md z-20">
              <Sparkles className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />
              <span>Catalog Specimen</span>
            </div>
            
            {activeImage ? (
              <img 
                src={activeImage} 
                alt={product.core.name}
                className="w-full h-full object-cover relative z-10"
              />
            ) : (
              <div className="text-center relative z-10 flex flex-col items-center gap-2">
                <Box className="w-16 h-16 text-slate-600 mb-2" />
                <span className="text-xs text-slate-400 uppercase tracking-widest font-extrabold">
                  {product.brand.name}
                </span>
              </div>
            )}
          </div>

          {/* Image Selector Thumbnails */}
          {product.core.images && product.core.images.length > 0 && (
            <div className="flex gap-3 justify-center">
              {product.core.images.map((imgUrl, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(imgUrl)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${activeImage === imgUrl ? 'border-sky-500 scale-105 shadow-md shadow-sky-500/10' : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700'}`}
                >
                  <img src={imgUrl} alt={`angle-${index}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Pricing History Indicator */}
          {product.pricing.pricingHistory && product.pricing.pricingHistory.length > 0 && (
            <div className="bg-slate-900/50 border border-slate-800/60 backdrop-blur-md rounded-2xl p-5 flex items-center gap-4 hover:border-slate-800 transition-colors">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-white text-xs font-bold">Active Price Tracing Enabled</span>
                <span className="text-slate-400 text-[11px] leading-relaxed">
                  Price shifted from ${product.pricing.pricingHistory[0]?.price?.toFixed(2)} to ${product.pricing.finalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Product Specs Detail Panel */}
        <div className="flex flex-col gap-6 justify-between">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-sky-500/10 text-sky-400 text-[10px] font-bold uppercase tracking-wider border border-sky-500/20">
                {product.category.hierarchy.main}
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 text-[10px] font-bold uppercase tracking-wider border border-slate-800">
                SKU: {product.identity.sku}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">{product.core.name}</h1>
            <span className="text-slate-300 text-sm font-medium">Brand: {product.brand.name} ({product.brand.country || 'Global'})</span>

            <div className="border-t border-slate-900 pt-5">
              <h3 className="text-slate-200 text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-sky-400" /> Description</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{product.core.shortDescription}</p>
              {product.core.fullDescription && (
                <p className="text-slate-400 text-xs mt-3 leading-relaxed border-l-2 border-slate-800 pl-3">{product.core.fullDescription}</p>
              )}
            </div>

            {/* Technical Specifications Map */}
            {specKeys.length > 0 && (
              <div className="border-t border-slate-900 pt-5">
                <h3 className="text-slate-200 text-xs font-bold uppercase tracking-wider mb-3.5">Technical Specifications</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {specKeys.map((key) => (
                    <div key={key} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between text-xs hover:border-slate-800 transition-colors">
                      <span className="text-slate-400 font-medium">{key}</span>
                      <span className="text-white font-bold">{product.core.technicalSpecifications[key]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dimensions and Weights */}
            {product.core.dimensions && (
              <div className="border-t border-slate-900 pt-5 flex gap-8">
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Dimensions</span>
                  <span className="text-white text-xs font-semibold">
                    {product.core.dimensions.width} x {product.core.dimensions.height} x {product.core.dimensions.depth} {product.core.dimensions.unit}
                  </span>
                </div>
                {product.core.weight && (
                  <div className="flex flex-col gap-1 border-l border-slate-800 pl-8">
                    <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Weight</span>
                    <span className="text-white text-xs font-semibold">
                      {product.core.weight.value} {product.core.weight.unit}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing & Add to Cart section */}
          <div className="border-t border-slate-900 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mt-8">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Price (incl. tax & shipping)</span>
              <div className="flex items-center gap-2.5 mt-1.5">
                <span className="text-white font-extrabold text-3xl">${product.pricing.finalPrice.toFixed(2)}</span>
                {hasDiscount && (
                  <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md font-bold border border-rose-500/20 uppercase tracking-wider">
                    -{product.pricing.discount?.value}% OFF
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.inventory.availableStock <= 0}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-violet-600 hover:from-sky-600 hover:to-violet-700 text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 w-full md:w-auto"
            >
              <ShoppingCart className="w-4 h-4" />
              {product.inventory.availableStock > 0 ? 'Add to Shopping Cart' : 'Out of Stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopperProductDetails;

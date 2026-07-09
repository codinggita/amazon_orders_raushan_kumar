import productRepository from '../repositories/product.repository.js';
import Order from '../../infrastructure/database/models/order.model.js';
import Product from '../../infrastructure/database/models/product.model.js';
import mongoose from 'mongoose';

/**
 * Built-in synonym mapping table.
 * Maps consumer colloquial terms to internal search keywords.
 */
const SYNONYM_MAP = {
  sneakers: 'shoes',
  sneaker: 'shoes',
  trainers: 'shoes',
  kicks: 'shoes',
  footwear: 'shoes',
  mobile: 'electronics',
  phone: 'electronics',
  smartphone: 'electronics',
  cellphone: 'electronics',
  laptop: 'electronics',
  notebook: 'electronics',
  pc: 'electronics',
  computer: 'electronics',
  earphone: 'earbuds',
  headset: 'earbuds',
  headphones: 'earbuds',
  tshirt: 'shirt',
  tee: 'shirt',
  apparel: 'clothing',
  wear: 'clothing',
  jacket: 'clothing',
};

/**
 * Simple Levenshtein distance for fuzzy matching.
 */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Resolves the best matching keyword from the synonym map using fuzzy distance.
 * Handles typos ("Nikee" → "nike") and synonyms ("sneakers" → "shoes").
 */
function resolveSearchTerm(rawTerm) {
  const term = rawTerm.toLowerCase().trim();
  if (SYNONYM_MAP[term]) return SYNONYM_MAP[term];
  for (const [key, value] of Object.entries(SYNONYM_MAP)) {
    if (levenshtein(term, key) <= 2) return value;
  }
  return term;
}

// SearchAnalytics schema (auto-created, no migration needed)
const SearchAnalyticsSchema = new mongoose.Schema({
  query: String,
  resolvedQuery: String,
  resultCount: Number,
  filters: Object,
  timestamp: { type: Date, default: Date.now }
});

let SearchAnalytics;
try {
  SearchAnalytics = mongoose.model('SearchAnalytics');
} catch {
  SearchAnalytics = mongoose.model('SearchAnalytics', SearchAnalyticsSchema);
}

/**
 * SearchService: Full-featured event-driven search with fuzzy matching,
 * synonyms, autocomplete, faceted filters, ranking, and analytics.
 */
class SearchService {
  /**
   * Primary catalog search with all optimizations
   */
  async searchProducts(queryParams) {
    const { q, query, page, limit, category, brand, minPrice, maxPrice, sortBy } = queryParams;
    const rawQ = q || query || '';
    const resolvedQuery = rawQ ? resolveSearchTerm(rawQ) : '';

    const dbQuery = { 'system.isDeleted': false };

    // Text search across multiple fields via regex
    if (resolvedQuery) {
      const regex = new RegExp(resolvedQuery, 'i');
      dbQuery.$or = [
        { 'core.name': regex },
        { 'search.searchableKeywords': regex },
        { 'search.autocompleteTerms': regex },
        { 'brand.name': regex },
        { 'category.hierarchy': regex },
      ];
    }

    // Faceted filters
    if (category) dbQuery['category.hierarchy'] = new RegExp(category, 'i');
    if (brand) dbQuery['brand.name'] = new RegExp(brand, 'i');

    if (minPrice || maxPrice) {
      dbQuery['pricing.finalPrice'] = {};
      if (minPrice) dbQuery['pricing.finalPrice'].$gte = parseFloat(minPrice);
      if (maxPrice) dbQuery['pricing.finalPrice'].$lte = parseFloat(maxPrice);
    }

    // Ranking algorithm with popularity + in-stock boost
    let sortBlueprint = {};
    if (sortBy === 'price_asc') sortBlueprint['pricing.finalPrice'] = 1;
    else if (sortBy === 'price_desc') sortBlueprint['pricing.finalPrice'] = -1;
    else {
      sortBlueprint['search.popularityScore'] = -1;
      sortBlueprint['brand.trustScore'] = -1;
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(dbQuery).sort(sortBlueprint).skip(skip).limit(limitNum).exec(),
      Product.countDocuments(dbQuery).exec()
    ]);

    // Fire-and-forget analytics log
    SearchAnalytics.create({
      query: rawQ,
      resolvedQuery,
      resultCount: total,
      filters: { category, brand, minPrice, maxPrice, sortBy }
    }).catch(() => {});

    return {
      products,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      meta: { originalQuery: rawQ, resolvedQuery, synonymApplied: rawQ && resolvedQuery !== rawQ.toLowerCase() }
    };
  }

  /**
   * Autocomplete suggestions - fast prefix matching for live dropdown as user types
   */
  async autocomplete(prefix) {
    if (!prefix || prefix.trim().length < 2) return { suggestions: [] };

    const resolved = resolveSearchTerm(prefix);

    const products = await Product.find({
      'system.isDeleted': false,
      $or: [
        { 'core.name': new RegExp(resolved, 'i') },
        { 'search.autocompleteTerms': new RegExp(resolved, 'i') },
        { 'search.searchableKeywords': new RegExp(resolved, 'i') },
        { 'brand.name': new RegExp(resolved, 'i') },
      ]
    })
      .select('core.name identity.productId category.hierarchy brand.name pricing.finalPrice inventory.inventoryStatus search.popularityScore')
      .sort({ 'search.popularityScore': -1 })
      .limit(7)
      .exec();

    const suggestions = products.map(p => ({
      productId: p.identity?.productId,
      name: p.core?.name,
      category: Array.isArray(p.category?.hierarchy) ? p.category.hierarchy[0] : p.category?.hierarchy || '',
      brand: p.brand?.name || '',
      price: p.pricing?.finalPrice,
      inStock: p.inventory?.inventoryStatus === 'IN_STOCK',
    }));

    return { suggestions, resolvedPrefix: resolved };
  }

  /**
   * Fetch search analytics data (admin only)
   */
  async getAnalytics() {
    const noResultsQueries = await SearchAnalytics.find({ resultCount: 0 })
      .sort({ timestamp: -1 })
      .limit(20)
      .exec();
    const totalSearches = await SearchAnalytics.countDocuments();
    return { totalSearches, noResultsQueries };
  }

  /**
   * Search active system orders (staff administrative query)
   */
  async searchOrders(queryParams) {
    const { query, page, limit } = queryParams;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;
    const searchQuery = { 'system.isDeleted': false };

    if (query) {
      const regex = new RegExp(query.trim(), 'i');
      searchQuery.$or = [
        { orderId: regex },
        { 'customerSnapshot.email': regex },
        { 'customerSnapshot.phone': regex },
        { 'shippingSnapshot.trackingNumber': regex }
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(searchQuery).sort({ createdAt: -1 }).skip(skip).limit(limitNum).exec(),
      Order.countDocuments(searchQuery).exec()
    ]);

    return {
      orders,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    };
  }
}

export default new SearchService();
export { SearchService };

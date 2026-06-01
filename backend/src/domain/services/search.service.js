import productRepository from '../repositories/product.repository.js';
import Order from '../../infrastructure/database/models/order.model.js';

/**
 * SearchService compiles fast queries over catalog items and orders.
 */
class SearchService {
  /**
   * Search active product catalog
   */
  async searchProducts(queryParams) {
    const { query, page, limit, category, brand, minPrice, maxPrice } = queryParams;
    
    const filters = {
      search: query,
      categoryId: category,
      brandId: brand,
      minPrice,
      maxPrice
    };

    return productRepository.queryCatalog(filters, { page, limit });
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
      // Find orders by orderId, buyer email, phone or tracking number
      const regex = new RegExp(query.trim(), 'i');
      searchQuery.$or = [
        { orderId: regex },
        { 'customerSnapshot.email': regex },
        { 'customerSnapshot.phone': regex },
        { 'shippingSnapshot.trackingNumber': regex }
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .exec(),
      Order.countDocuments(searchQuery).exec()
    ]);

    return {
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };
  }
}

export default new SearchService();
export { SearchService };

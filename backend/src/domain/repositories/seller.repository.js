import User from '../../infrastructure/database/models/user.model.js';
import Product from '../../infrastructure/database/models/product.model.js';
import Order from '../../infrastructure/database/models/order.model.js';

/**
 * SellerRepository isolates database access for Merchant/Seller users
 * and compiles merchant-specific catalog and sales aggregates.
 */
class SellerRepository {
  sellerRoles = ['SELLER', 'VERIFIED_SELLER'];

  /**
   * Retrieve a paginated list of active sellers
   */
  async findAll(pagination = {}) {
    const page = Math.max(1, parseInt(pagination.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(pagination.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = { role: { $in: this.sellerRoles } };

    const [sellers, total] = await Promise.all([
      User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      User.countDocuments(query).exec()
    ]);

    const pages = Math.ceil(total / limit);

    return {
      sellers,
      pagination: { page, limit, total, pages }
    };
  }

  /**
   * Resolve a merchant by their unique sellerId
   */
  async findById(sellerId) {
    return User.findOne({ 
      userId: sellerId, 
      role: { $in: this.sellerRoles } 
    }).exec();
  }

  /**
   * Resolve all active catalog products supplied by a specific merchant
   */
  async findProductsBySeller(sellerId) {
    // Map sellerId to product brand.brandId
    return Product.find({ 
      'brand.brandId': sellerId,
      'system.isDeleted': false 
    }).sort({ 'search.popularityScore': -1 }).exec();
  }

  /**
   * Compute merchant performance analytics
   * Matches orders containing this seller's products and aggregates revenue.
   */
  async getSellerAnalytics(sellerId) {
    // 1. Resolve all productIds belonging to this seller
    const products = await this.findProductsBySeller(sellerId);
    const productIds = products.map((p) => p.identity.productId);

    if (productIds.length === 0) {
      return {
        revenue: 0,
        ordersCount: 0,
        unitsSold: 0,
        productsCount: 0
      };
    }

    // 2. Aggregate sales metrics from confirmed orders matching productIds
    const stats = await Order.aggregate([
      {
        $match: {
          status: { $in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] },
          'products.productSnapshot.productId': { $in: productIds }
        }
      },
      { $unwind: '$products' },
      {
        $match: {
          'products.productSnapshot.productId': { $in: productIds }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: { $multiply: ['$products.pricingSnapshot.finalPricePerUnit', '$products.quantity'] } },
          unitsSold: { $sum: '$products.quantity' },
          uniqueOrders: { $addToSet: '$orderId' } // track order count
        }
      },
      {
        $project: {
          _id: 0,
          revenue: { $round: ['$revenue', 2] },
          unitsSold: 1,
          ordersCount: { $size: '$uniqueOrders' }
        }
      }
    ]).exec();

    const metrics = stats[0] || { revenue: 0, unitsSold: 0, ordersCount: 0 };

    return {
      revenue: metrics.revenue,
      ordersCount: metrics.ordersCount,
      unitsSold: metrics.unitsSold,
      productsCount: productIds.length
    };
  }
}

export default new SellerRepository();
export { SellerRepository };

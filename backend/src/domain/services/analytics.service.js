import Order from '../../infrastructure/database/models/order.model.js';
import ApiError from '../../utils/apiError.js';

/**
 * AnalyticsService compiles granular commerce business intelligence reports.
 */
class AnalyticsService {
  /**
   * Helper to build date range filters
   */
  _buildDateFilter(startDate, endDate) {
    const filter = {};
    if (startDate) filter.$gte = new Date(startDate);
    if (endDate) filter.$lte = new Date(endDate);
    return filter;
  }

  /**
   * Helper to build initial match stage
   */
  _buildMatchStage(queryParams) {
    const { startDate, endDate } = queryParams;
    const match = {
      status: { $in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] }
    };
    const dateFilter = this._buildDateFilter(startDate, endDate);
    if (Object.keys(dateFilter).length > 0) {
      match.createdAt = dateFilter;
    }
    return match;
  }

  /**
   * 1. Revenue Metrics Dashboard
   */
  async getRevenueMetrics(queryParams) {
    const matchStage = this._buildMatchStage(queryParams);
    const result = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$analyticsSnapshot.totalRevenue' },
          subtotal: { $sum: '$analyticsSnapshot.subtotalAmount' },
          discounts: { $sum: '$analyticsSnapshot.discountAmount' },
          tax: { $sum: '$analyticsSnapshot.taxAmount' },
          shipping: { $sum: '$analyticsSnapshot.shippingAmount' },
          count: { $sum: 1 }
        }
      }
    ]).exec();

    const data = result[0] || { totalRevenue: 0, subtotal: 0, discounts: 0, tax: 0, shipping: 0, count: 0 };
    return {
      totalRevenue: parseFloat(data.totalRevenue.toFixed(2)),
      subtotal: parseFloat(data.subtotal.toFixed(2)),
      discounts: parseFloat(data.discounts.toFixed(2)),
      tax: parseFloat(data.tax.toFixed(2)),
      shipping: parseFloat(data.shipping.toFixed(2)),
      orderCount: data.count
    };
  }

  /**
   * 2. Top Performing Products Catalog
   */
  async getTopProducts(queryParams) {
    const matchStage = this._buildMatchStage(queryParams);
    const limit = parseInt(queryParams.limit, 10) || 5;

    return Order.aggregate([
      { $match: matchStage },
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.productSnapshot.productId',
          name: { $first: '$products.productSnapshot.name' },
          sku: { $first: '$products.productSnapshot.sku' },
          unitsSold: { $sum: '$products.quantity' },
          revenue: { $sum: { $multiply: ['$products.pricingSnapshot.finalPricePerUnit', '$products.quantity'] } }
        }
      },
      { $project: { productId: '$_id', name: 1, sku: 1, unitsSold: 1, revenue: { $round: ['$revenue', 2] }, _id: 0 } },
      { $sort: { unitsSold: -1 } },
      { $limit: limit }
    ]).exec();
  }

  /**
   * 3. Top Spender Customers
   */
  async getTopCustomers(queryParams) {
    const matchStage = this._buildMatchStage(queryParams);
    const limit = parseInt(queryParams.limit, 10) || 5;

    return Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$customerSnapshot.userId',
          email: { $first: '$customerSnapshot.email' },
          name: { $first: { $concat: ['$customerSnapshot.firstName', ' ', '$customerSnapshot.lastName'] } },
          ordersCount: { $sum: 1 },
          totalSpent: { $sum: '$analyticsSnapshot.totalRevenue' }
        }
      },
      { $project: { userId: '$_id', email: 1, name: 1, ordersCount: 1, totalSpent: { $round: ['$totalSpent', 2] }, _id: 0 } },
      { $sort: { totalSpent: -1 } },
      { $limit: limit }
    ]).exec();
  }

  /**
   * 4. Sales metrics by Category Path
   */
  async getCategorySales(queryParams) {
    const matchStage = this._buildMatchStage(queryParams);
    return Order.aggregate([
      { $match: matchStage },
      { $unwind: '$products' },
      {
        $group: {
          _id: { $arrayElemAt: ['$products.productSnapshot.categoryPath', 0] },
          revenue: { $sum: { $multiply: ['$products.pricingSnapshot.finalPricePerUnit', '$products.quantity'] } },
          unitsSold: { $sum: '$products.quantity' }
        }
      },
      { $project: { category: '$_id', revenue: { $round: ['$revenue', 2] }, unitsSold: 1, _id: 0 } },
      { $sort: { revenue: -1 } }
    ]).exec();
  }

  /**
   * 5. Sales metrics by Brand
   */
  async getBrandSales(queryParams) {
    const matchStage = this._buildMatchStage(queryParams);
    return Order.aggregate([
      { $match: matchStage },
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.productSnapshot.brandName',
          revenue: { $sum: { $multiply: ['$products.pricingSnapshot.finalPricePerUnit', '$products.quantity'] } },
          unitsSold: { $sum: '$products.quantity' }
        }
      },
      { $project: { brand: '$_id', revenue: { $round: ['$revenue', 2] }, unitsSold: 1, _id: 0 } },
      { $sort: { revenue: -1 } }
    ]).exec();
  }

  /**
   * 6. Country Spread metrics
   */
  async getCountrySales(queryParams) {
    const matchStage = this._buildMatchStage(queryParams);
    return Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$shippingSnapshot.address.country',
          ordersCount: { $sum: 1 },
          revenue: { $sum: '$analyticsSnapshot.totalRevenue' }
        }
      },
      { $project: { country: '$_id', ordersCount: 1, revenue: { $round: ['$revenue', 2] }, _id: 0 } },
      { $sort: { revenue: -1 } }
    ]).exec();
  }

  /**
   * 7. State Spread metrics
   */
  async getStateSales(queryParams) {
    const matchStage = this._buildMatchStage(queryParams);
    return Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$shippingSnapshot.address.state',
          ordersCount: { $sum: 1 },
          revenue: { $sum: '$analyticsSnapshot.totalRevenue' }
        }
      },
      { $project: { state: '$_id', ordersCount: 1, revenue: { $round: ['$revenue', 2] }, _id: 0 } },
      { $sort: { revenue: -1 } }
    ]).exec();
  }

  /**
   * 8. City Spread metrics
   */
  async getCitySales(queryParams) {
    const matchStage = this._buildMatchStage(queryParams);
    return Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$shippingSnapshot.address.city',
          ordersCount: { $sum: 1 },
          revenue: { $sum: '$analyticsSnapshot.totalRevenue' }
        }
      },
      { $project: { city: '$_id', ordersCount: 1, revenue: { $round: ['$revenue', 2] }, _id: 0 } },
      { $sort: { revenue: -1 } }
    ]).exec();
  }

  /**
   * 9. Payment Distribution Method metrics
   */
  async getPaymentDistribution(queryParams) {
    const matchStage = this._buildMatchStage(queryParams);
    return Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$paymentSnapshot.method',
          transactionCount: { $sum: 1 },
          revenue: { $sum: '$analyticsSnapshot.totalRevenue' }
        }
      },
      { $project: { paymentMethod: '$_id', transactionCount: 1, revenue: { $round: ['$revenue', 2] }, _id: 0 } },
      { $sort: { revenue: -1 } }
    ]).exec();
  }

  /**
   * 10. Order Status Spread metrics (includes CANCELLED, PENDING, DELIVERED)
   */
  async getOrderStatusSpread(queryParams) {
    const { startDate, endDate } = queryParams;
    const match = {};
    const dateFilter = this._buildDateFilter(startDate, endDate);
    if (Object.keys(dateFilter).length > 0) {
      match.createdAt = dateFilter;
    }

    return Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$analyticsSnapshot.totalRevenue' }
        }
      },
      { $project: { status: '$_id', count: 1, revenue: { $round: ['$revenue', 2] }, _id: 0 } },
      { $sort: { count: -1 } }
    ]).exec();
  }

  /**
   * 11. Seller Store Performance metrics
   */
  async getSellerPerformance(queryParams) {
    const matchStage = this._buildMatchStage(queryParams);
    return Order.aggregate([
      { $match: matchStage },
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.productSnapshot.brandName', // Using brand/seller as key
          ordersCount: { $sum: 1 },
          revenue: { $sum: { $multiply: ['$products.pricingSnapshot.finalPricePerUnit', '$products.quantity'] } },
          unitsSold: { $sum: '$products.quantity' }
        }
      },
      { $project: { brand: '$_id', ordersCount: 1, revenue: { $round: ['$revenue', 2] }, unitsSold: 1, _id: 0 } },
      { $sort: { revenue: -1 } }
    ]).exec();
  }

  /**
   * Multi-faceted overall dashboard rollup
   */
  async getCommerceDashboard(queryParams) {
    const [overall, topProducts, categoryBreakdown, geographicBreakdown, paymentDistribution] = await Promise.all([
      this.getRevenueMetrics(queryParams),
      this.getTopProducts(queryParams),
      this.getCategorySales(queryParams),
      this.getCountrySales(queryParams),
      this.getPaymentDistribution(queryParams)
    ]);

    return {
      overall,
      topProducts,
      categoryBreakdown,
      geographicBreakdown,
      paymentDistribution
    };
  }
}

export default new AnalyticsService();
export { AnalyticsService };

import Order from '../../infrastructure/database/models/order.model.js';

/**
 * OrderRepository handles data persistence operations and state updates
 * for Order documents, keeping business layer clean.
 */
class OrderRepository {
  /**
   * Find an order by its unique custom orderId
   */
  async findById(orderId) {
    return Order.findOne({ orderId }).exec();
  }

  /**
   * Find order profiles by their customer userId
   */
  async findByUserId(userId) {
    return Order.find({ 'customerSnapshot.userId': userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Insert a new order entry
   */
  async create(orderData) {
    const order = new Order(orderData);
    return order.save();
  }

  /**
   * Update order fields directly (e.g. shipping address, billing, tracking)
   */
  async update(orderId, updateData) {
    return Order.findOneAndUpdate(
      { orderId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Soft delete an order from standard views
   */
  async softDelete(orderId) {
    return Order.findOneAndUpdate(
      { orderId },
      { 
        $set: { 
          'system.isDeleted': true,
          'system.deletedAt': new Date() 
        } 
      },
      { new: true }
    ).exec();
  }

  /**
   * Advanced multi-filter paginated query engine for staff/administrative dashboards
   */
  async queryCatalog(filters = {}, pagination = {}, sort = {}) {
    const query = { 'system.isDeleted': false };

    if (filters.userId) {
      query['customerSnapshot.userId'] = filters.userId;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.paymentStatus) {
      query['paymentSnapshot.status'] = filters.paymentStatus;
    }

    if (filters.country) {
      query['shippingSnapshot.address.country'] = filters.country;
    }

    const page = Math.max(1, parseInt(pagination.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(pagination.limit, 10) || 10));
    const skip = (page - 1) * limit;

    let sortBlueprint = { createdAt: -1 };
    if (sort.field) {
      const order = sort.order === 'desc' ? -1 : 1;
      if (sort.field === 'revenue') {
        sortBlueprint['analyticsSnapshot.totalRevenue'] = order;
      } else if (sort.field === 'date') {
        sortBlueprint.createdAt = order;
      }
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort(sortBlueprint)
        .skip(skip)
        .limit(limit)
        .exec(),
      Order.countDocuments(query).exec()
    ]);

    const pages = Math.ceil(total / limit);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    };
  }

  /**
   * Transition order status.
   * Leverages Mongoose pre-save hooks to enforce finite state machine validity and audit logging.
   */
  async updateStatus(orderId, newStatus, changedBy = 'SYSTEM', note = '') {
    const order = await Order.findOne({ orderId });
    if (!order) return null;

    order.status = newStatus;
    
    // Push the audit context before saving to allow the pre-save hook to use it
    if (note) {
      order.auditTrail.push({
        status: newStatus,
        changedAt: new Date(),
        changedBy,
        note
      });
    }

    return order.save();
  }
}

export default new OrderRepository();
export { OrderRepository };

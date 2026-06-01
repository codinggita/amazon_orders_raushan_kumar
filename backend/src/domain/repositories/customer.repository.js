import User from '../../infrastructure/database/models/user.model.js';
import Order from '../../infrastructure/database/models/order.model.js';

/**
 * CustomerRepository isolates database access for Customer users
 * by filtering operations by customer-specific security roles.
 */
class CustomerRepository {
  // Roles classifying a profile as a Customer
  customerRoles = ['CUSTOMER', 'PREMIUM_CUSTOMER'];

  /**
   * Fetch a paginated list of registered customers
   */
  async findAll(pagination = {}) {
    const page = Math.max(1, parseInt(pagination.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(pagination.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = { role: { $in: this.customerRoles } };

    const [customers, total] = await Promise.all([
      User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      User.countDocuments(query).exec()
    ]);

    const pages = Math.ceil(total / limit);

    return {
      customers,
      pagination: { page, limit, total, pages }
    };
  }

  /**
   * Resolve a customer by their unique customerId
   */
  async findById(customerId) {
    return User.findOne({ 
      userId: customerId, 
      role: { $in: this.customerRoles } 
    }).exec();
  }

  /**
   * Update customer profile attributes
   */
  async update(customerId, updateData) {
    return User.findOneAndUpdate(
      { userId: customerId, role: { $in: this.customerRoles } },
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Deactivate a customer account (sets status to SUSPENDED)
   */
  async deactivate(customerId) {
    return User.findOneAndUpdate(
      { userId: customerId, role: { $in: this.customerRoles } },
      { $set: { accountStatus: 'SUSPENDED' } },
      { new: true }
    ).exec();
  }

  /**
   * Fetch comprehensive order history list for a shopper
   */
  async findOrders(customerId) {
    return Order.find({ 'customerSnapshot.userId': customerId })
      .sort({ createdAt: -1 })
      .exec();
  }
}

export default new CustomerRepository();
export { CustomerRepository };

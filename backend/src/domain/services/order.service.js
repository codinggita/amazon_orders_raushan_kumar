import crypto from 'crypto';
import orderRepository from '../repositories/order.repository.js';
import productRepository from '../repositories/product.repository.js';
import ApiError from '../../utils/apiError.js';

/**
 * OrderService manages transactional order lifecycles, ensuring atomic inventory consistency,
 * immutable financial snapshot captures, and strict FSM state transitions.
 */
class OrderService {
  /**
   * Initialize a new order with atomic multi-item stock reservation and rollback mechanisms
   */
  async createOrder(currentUser, input) {
    const { products, shippingAddress, paymentMethod, phone } = input;

    if (!products || !Array.isArray(products) || products.length === 0) {
      throw new ApiError(400, 'Orders must contain at least one product selection.', 'VALIDATION_FAILED');
    }

    if (!shippingAddress || !paymentMethod || !phone) {
      throw new ApiError(400, 'Shipping address, payment method, and contact phone are required.', 'VALIDATION_FAILED');
    }

    const reservedItems = [];
    const snapshotsList = [];
    let subtotalAmount = 0;
    let discountAmount = 0;
    let taxAmount = 0;
    let shippingAmount = 0;

    try {
      // 1. Resolve and reserve stock atomically for each product
      for (const item of products) {
        const { productId, quantity } = item;
        if (!productId || quantity <= 0) {
          throw new ApiError(400, 'Invalid product selection or quantity.', 'VALIDATION_FAILED');
        }

        // Fetch product details
        const product = await productRepository.findById(productId);
        if (!product) {
          throw new ApiError(404, `Product ID "${productId}" could not be resolved.`, 'PRODUCT_NOT_FOUND');
        }

        // Try to book stock atomically directly in the DB
        const updatedProduct = await productRepository.reserveStock(productId, quantity);
        if (!updatedProduct) {
          throw new ApiError(409, `Insufficient inventory available for product: "${product.core.name}".`, 'INSUFFICIENT_STOCK');
        }

        // Track successfully reserved items for rollback case
        reservedItems.push({ productId, quantity });

        // Calculate pricing parameters snapshot
        const basePricePerUnit = product.pricing.basePrice;
        const discountType = product.pricing.discount?.type || 'NONE';
        const discountValue = product.pricing.discount?.value || 0;
        const taxRate = product.pricing.tax?.rate || 0;
        const finalPricePerUnit = product.pricing.finalPrice;

        const subtotalVal = basePricePerUnit * quantity;
        let discountVal = 0;
        if (discountType === 'PERCENTAGE') {
          discountVal = (subtotalVal * (discountValue / 100));
        } else if (discountType === 'FLAT') {
          discountVal = discountValue * quantity;
        }

        const taxVal = ((subtotalVal - discountVal) * (taxRate / 100));
        const shippingVal = (product.pricing.shippingCost || 0) * quantity;

        subtotalAmount += subtotalVal;
        discountAmount += discountVal;
        taxAmount += taxVal;
        shippingAmount += shippingVal;

        // Build product snapshot
        const productSnapshot = {
          productId: product.identity.productId,
          sku: product.identity.sku,
          name: product.core.name,
          shortDescription: product.core.shortDescription,
          categoryPath: product.category.path,
          brandName: product.brand.name
        };

        // Build pricing snapshot
        const pricingSnapshot = {
          basePrice: basePricePerUnit,
          discountType,
          discountValue,
          taxRate,
          shippingCost: product.pricing.shippingCost || 0,
          finalPricePerUnit
        };

        snapshotsList.push({
          productSnapshot,
          pricingSnapshot,
          quantity
        });
      }

      // Calculate final total
      const totalRevenue = Math.max(0, parseFloat((subtotalAmount - discountAmount + taxAmount + shippingAmount).toFixed(2)));

      // 2. Build immutable buyer context snapshot
      const customerSnapshot = {
        userId: currentUser.userId,
        email: currentUser.email,
        firstName: currentUser.firstName || 'Guest',
        lastName: currentUser.lastName || 'User',
        phone
      };

      // 3. Compile transaction ID details
      const paymentId = `pay_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;
      const paymentSnapshot = {
        paymentId,
        method: paymentMethod,
        status: 'PENDING',
        amount: totalRevenue
      };

      // 4. Compile shipping logistics details
      const shippingSnapshot = {
        address: shippingAddress,
        carrier: 'UNASSIGNED'
      };

      // 5. Generate secure orderId
      const orderId = `ord_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;

      // 6. Persist order record
      const order = await orderRepository.create({
        orderId,
        customerSnapshot,
        products: snapshotsList,
        paymentSnapshot,
        shippingSnapshot,
        status: 'PENDING',
        analyticsSnapshot: {
          subtotalAmount: parseFloat(subtotalAmount.toFixed(2)),
          discountAmount: parseFloat(discountAmount.toFixed(2)),
          taxAmount: parseFloat(taxAmount.toFixed(2)),
          shippingAmount: parseFloat(shippingAmount.toFixed(2)),
          totalRevenue
        }
      });

      return order;

    } catch (error) {
      // ATOMIC TRANSACTION ROLLBACK: Release all reserved stocks immediately to prevent inventory leaks
      for (const item of reservedItems) {
        await productRepository.releaseStock(item.productId, item.quantity);
      }
      throw error;
    }
  }

  /**
   * Capture checkout payment completion, confirming the sale atomically
   */
  async capturePayment(orderId, transactionId) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new ApiError(404, `Order with ID "${orderId}" could not be resolved.`, 'ORDER_NOT_FOUND');
    }

    if (order.status !== 'PENDING') {
      throw new ApiError(400, `Cannot process payment capture. Order is currently in "${order.status}" status.`, 'INVALID_ORDER_STATE');
    }

    // 1. Confirm stock sales atomically in catalog
    for (const item of order.products) {
      await productRepository.confirmStockSale(item.productSnapshot.productId, item.quantity);
    }

    // 2. Update payment details inside order snapshot
    order.paymentSnapshot.status = 'COMPLETED';
    order.paymentSnapshot.transactionId = transactionId;
    order.paymentSnapshot.paidAt = new Date();

    // 3. Transition status to CONFIRMED
    order.status = 'CONFIRMED';
    return order.save();
  }

  /**
   * Cancel an order and release reserved stock back into active inventory
   */
  async cancelOrder(orderId, changedBy = 'SYSTEM', note = 'User requested cancellation.') {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new ApiError(404, `Order with ID "${orderId}" does not exist.`, 'ORDER_NOT_FOUND');
    }

    // Enforce cancellations are only valid for PENDING / CONFIRMED orders
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new ApiError(400, `Cannot cancel order. Current status is "${order.status}".`, 'INVALID_ORDER_STATE');
    }

    const originalStatus = order.status;

    // 1. Transition order state to CANCELLED (FSM checks auto-run here)
    order.status = 'CANCELLED';
    
    // Add custom audit note
    order.auditTrail.push({
      status: 'CANCELLED',
      changedAt: new Date(),
      changedBy,
      note
    });

    const savedOrder = await order.save();

    // 2. Release reserved stocks atomically back to the available pool
    for (const item of order.products) {
      // If order was already PAID (CONFIRMED), it shifted stock to soldStock, so we adjust sold stock.
      // Otherwise (PENDING), we release it from reservedStock.
      if (originalStatus === 'CONFIRMED') {
        // Shift sold stock back to available pool
        await productRepository.update(item.productSnapshot.productId, {
          $inc: {
            'inventory.availableStock': item.quantity,
            'inventory.soldStock': -item.quantity
          }
        });
      } else {
        // Shift reserved stock back to available pool
        await productRepository.releaseStock(item.productSnapshot.productId, item.quantity);
      }
    }

    return savedOrder;
  }

  /**
   * Resolve an order profile
   */
  async getOrder(orderId) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new ApiError(404, `Order with ID "${orderId}" could not be found.`, 'ORDER_NOT_FOUND');
    }
    return order;
  }

  /**
   * Fetch buyer order history list
   */
  async getBuyerOrders(userId) {
    return orderRepository.findByUserId(userId);
  }

  /**
   * Fetch paginated list of all orders (staff administrative query)
   */
  async getOrders(queryParams) {
    const { page, limit, userId, status, paymentStatus, country, sortBy, sortOrder } = queryParams;

    const filters = { userId, status, paymentStatus, country };
    const pagination = { page, limit };
    const sort = { field: sortBy, order: sortOrder };

    return orderRepository.queryCatalog(filters, pagination, sort);
  }

  /**
   * Update order details (administrative overrides)
   */
  async updateOrder(orderId, updateInput) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new ApiError(404, `Order with ID "${orderId}" could not be resolved.`, 'ORDER_NOT_FOUND');
    }

    const { shippingAddress, trackingNumber, carrier, paymentStatus, estimatedDelivery } = updateInput;

    const updates = {};
    if (shippingAddress) updates['shippingSnapshot.address'] = shippingAddress;
    if (trackingNumber) updates['shippingSnapshot.trackingNumber'] = trackingNumber;
    if (carrier) updates['shippingSnapshot.carrier'] = carrier;
    if (paymentStatus) updates['paymentSnapshot.status'] = paymentStatus;
    if (estimatedDelivery) updates['shippingSnapshot.estimatedDelivery'] = new Date(estimatedDelivery);

    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, 'No valid order updates provided.', 'VALIDATION_FAILED');
    }

    return orderRepository.update(orderId, updates);
  }

  /**
   * Transition order status adhering to finite-state-machine rules
   */
  async transitionOrderStatus(orderId, status, changedBy = 'SYSTEM', note = '') {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new ApiError(404, `Order with ID "${orderId}" could not be resolved.`, 'ORDER_NOT_FOUND');
    }

    // Try status transition
    return orderRepository.updateStatus(orderId, status, changedBy, note);
  }

  /**
   * Soft delete an order from system views
   */
  async softDeleteOrder(orderId) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new ApiError(404, `Order with ID "${orderId}" could not be resolved.`, 'ORDER_NOT_FOUND');
    }

    return orderRepository.softDelete(orderId);
  }
}

export default new OrderService();
export { OrderService };

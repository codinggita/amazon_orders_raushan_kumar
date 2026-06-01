import orderService from '../../domain/services/order.service.js';
import ApiResponse from '../../utils/apiResponse.js';
import ApiError from '../../utils/apiError.js';

/**
 * OrderController orchestrates Express request/response flow for transactions.
 */
class OrderController {
  /**
   * Handle transactional checkout requests
   */
  createOrder = async (req, res, next) => {
    try {
      const { products, shippingAddress, paymentMethod, phone } = req.body;
      const currentUser = {
        userId: req.user.userId,
        email: req.user.email,
        firstName: req.user.firstName || 'Buyer',
        lastName: req.user.lastName || 'User'
      };

      const order = await orderService.createOrder(currentUser, {
        products,
        shippingAddress,
        paymentMethod,
        phone
      });

      res.status(201).json(
        new ApiResponse(201, order, 'Order created successfully. Please proceed with payment.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Capture and complete payment transactions
   */
  capturePayment = async (req, res, next) => {
    try {
      const { orderId } = req.params;
      const { transactionId } = req.body;

      if (!transactionId) {
        throw new ApiError(400, 'A valid payment processor transactionId is required.', 'VALIDATION_FAILED');
      }

      const order = await orderService.capturePayment(orderId, transactionId);

      res.status(200).json(
        new ApiResponse(200, order, 'Payment processed successfully. Order confirmed.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cancel an active order and release booked stock
   */
  cancelOrder = async (req, res, next) => {
    try {
      const { orderId } = req.params;
      const { note } = req.body;

      // Verify ownership before cancelling
      const order = await orderService.getOrder(orderId);
      const isOwner = order.customerSnapshot.userId === req.user.userId;
      const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'SUPPORT_AGENT'].includes(req.user.role);

      if (!isOwner && !isAdmin) {
        throw new ApiError(403, 'Access denied. You do not possess ownership permissions to cancel this order.', 'INSUFFICIENT_PERMISSIONS');
      }

      const cancelled = await orderService.cancelOrder(
        orderId, 
        req.user.userId, 
        note || 'User-triggered cancellation.'
      );

      res.status(200).json(
        new ApiResponse(200, cancelled, 'Order cancelled successfully. Booked stocks released.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch single order details
   */
  getOrder = async (req, res, next) => {
    try {
      const { orderId } = req.params;
      const order = await orderService.getOrder(orderId);

      // Verify ownership or staff permissions
      const isOwner = order.customerSnapshot.userId === req.user.userId;
      const hasStaffScope = ['ADMIN', 'SUPER_ADMIN', 'SUPPORT_AGENT', 'ANALYTICS_MANAGER'].includes(req.user.role);

      if (!isOwner && !hasStaffScope) {
        throw new ApiError(403, 'Access denied. You do not possess permissions to view this order details.', 'INSUFFICIENT_PERMISSIONS');
      }

      res.status(200).json(
        new ApiResponse(200, order, 'Order fetched successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch order history for the active buyer profile
   */
  getBuyerOrders = async (req, res, next) => {
    try {
      const orders = await orderService.getBuyerOrders(req.user.userId);
      
      res.status(200).json(
        new ApiResponse(200, orders, 'Buyer order history logs fetched.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch paginated list of all orders (staff administrative query)
   */
  getOrders = async (req, res, next) => {
    try {
      const result = await orderService.getOrders(req.query);

      res.status(200).json(
        new ApiResponse(200, result.orders, 'Administrative orders listing resolved.', result.pagination)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update order details (administrative overrides)
   */
  updateOrder = async (req, res, next) => {
    try {
      const { orderId } = req.params;
      const updated = await orderService.updateOrder(orderId, req.body);

      res.status(200).json(
        new ApiResponse(200, updated, 'Order details updated successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Transition order status adhering to finite-state-machine bounds
   */
  transitionOrderStatus = async (req, res, next) => {
    try {
      const { orderId } = req.params;
      const { status, note } = req.body;

      if (!status) {
        throw new ApiError(400, 'Target status parameter is required for FSM transitions.', 'VALIDATION_FAILED');
      }

      const updated = await orderService.transitionOrderStatus(orderId, status, req.user.userId, note || 'FSM Transition triggered.');

      res.status(200).json(
        new ApiResponse(200, updated, `Order status successfully transitioned to "${status}".`)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Soft-delete an order
   */
  deleteOrder = async (req, res, next) => {
    try {
      const { orderId } = req.params;
      await orderService.softDeleteOrder(orderId);

      res.status(200).json(
        new ApiResponse(200, null, 'Order successfully soft-deleted from active system indexes.')
      );
    } catch (error) {
      next(error);
    }
  };
}

export default new OrderController();
export { OrderController };

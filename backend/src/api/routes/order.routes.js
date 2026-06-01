import { Router } from 'express';
import orderController from '../controllers/order.controller.js';
import { authenticate, requirePermissions } from '../../middlewares/auth.middleware.js';

const router = Router();

// Protect all checkout transactions with JWT Authentication
router.use(authenticate);

// Buyer-Specific Order Operations
router.post('/', orderController.createOrder);
router.get('/my-orders', orderController.getBuyerOrders); // Decoupled buyer route
router.get('/:orderId', orderController.getOrder);
router.post('/:orderId/pay', orderController.capturePayment);
router.post('/:orderId/cancel', orderController.cancelOrder);

// Administrative / Staff Operations (Protected by VIEW_ANALYTICS / MANAGE_INVENTORY scope)
router.get(
  '/', 
  requirePermissions('VIEW_ANALYTICS'), 
  orderController.getOrders
);

router.patch(
  '/:orderId', 
  requirePermissions('MANAGE_INVENTORY'), 
  orderController.updateOrder
);

router.patch(
  '/:orderId/status', 
  requirePermissions('MANAGE_INVENTORY'), 
  orderController.transitionOrderStatus
);

router.delete(
  '/:orderId', 
  requirePermissions('VIEW_ANALYTICS'), 
  orderController.deleteOrder
);

export default router;

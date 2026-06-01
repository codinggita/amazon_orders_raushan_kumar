import { Router } from 'express';
import customerController from '../controllers/customer.controller.js';
import { authenticate, requirePermissions } from '../../middlewares/auth.middleware.js';

const router = Router();

// Protect all customer shopper endpoints with JWT Authentication
router.use(authenticate);

// Staff / Administrative Shopper Listings View Route
router.get(
  '/', 
  requirePermissions('VIEW_ANALYTICS'), 
  customerController.getCustomers
);

// Individual Shopper Profile & Mutation Routes
router.get('/:customerId', customerController.getCustomer);
router.patch('/:customerId', customerController.updateCustomer);
router.delete('/:customerId', customerController.deleteCustomer);

// Shopper Transactional order history (Frequently asked database query)
router.get('/:customerId/orders', customerController.getCustomerOrders);

export default router;

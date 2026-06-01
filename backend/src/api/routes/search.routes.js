import { Router } from 'express';
import searchController from '../controllers/search.controller.js';
import { authenticate, requirePermissions } from '../../middlewares/auth.middleware.js';

const router = Router();

// Products search is publicly accessible (open search catalog)
router.get('/products', searchController.searchProducts);

// Orders search is secured for staff accounts
router.get(
  '/orders',
  authenticate,
  requirePermissions('VIEW_ANALYTICS'),
  searchController.searchOrders
);

export default router;

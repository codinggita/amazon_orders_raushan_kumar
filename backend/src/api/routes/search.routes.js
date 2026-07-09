import { Router } from 'express';
import searchController from '../controllers/search.controller.js';
import { authenticate, requirePermissions } from '../../middlewares/auth.middleware.js';

const router = Router();

// Public: main product search (fully open)
router.get('/products', searchController.searchProducts);

// Public: autocomplete suggestions as user types
router.get('/autocomplete', searchController.autocomplete);

// Staff only: orders search
router.get(
  '/orders',
  authenticate,
  requirePermissions('VIEW_ANALYTICS'),
  searchController.searchOrders
);

// Admin only: search analytics data
router.get(
  '/analytics',
  authenticate,
  requirePermissions('VIEW_ANALYTICS'),
  searchController.getSearchAnalytics
);

export default router;

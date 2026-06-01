import { Router } from 'express';
import sellerController from '../controllers/seller.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

// Public Merchant Discovery & Catalog Endpoints
router.get('/', sellerController.getSellers);
router.get('/:sellerId', sellerController.getSeller);
router.get('/:sellerId/products', sellerController.getSellerProducts);

// Protected Merchant Performance Telemetry Endpoint (Requires JWT validation)
router.get('/:sellerId/analytics', authenticate, sellerController.getSellerAnalytics);

export default router;

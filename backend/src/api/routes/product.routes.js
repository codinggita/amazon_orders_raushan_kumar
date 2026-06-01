import { Router } from 'express';
import productController from '../controllers/product.controller.js';
import { authenticate, requirePermissions } from '../../middlewares/auth.middleware.js';

const router = Router();

// Public Catalog Queries & Discovery Endpoints
router.get('/', productController.getProducts);
router.get('/:productId', productController.getProduct);

// Protected Catalog Management Endpoints
router.post(
  '/', 
  authenticate, 
  requirePermissions('MANAGE_INVENTORY'), 
  productController.createProduct
);

router.patch(
  '/:productId', 
  authenticate, 
  requirePermissions('MANAGE_INVENTORY'), 
  productController.updateProduct
);

router.delete(
  '/:productId', 
  authenticate, 
  requirePermissions('MANAGE_INVENTORY'), 
  productController.deleteProduct
);

export default router;

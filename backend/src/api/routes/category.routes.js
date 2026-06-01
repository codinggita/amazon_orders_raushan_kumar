import { Router } from 'express';
import categoryController from '../controllers/category.controller.js';
import { authenticate, requirePermissions } from '../../middlewares/auth.middleware.js';

const router = Router();

// Public Taxonomy Exploration Endpoints
router.get('/', categoryController.getCategories);
router.get('/subcategories', categoryController.getSubcategories);
router.get('/:categoryId', categoryController.getCategoryById);

// Protected Taxonomy Mutation Endpoints
router.post(
  '/', 
  authenticate, 
  requirePermissions('MANAGE_INVENTORY'), 
  categoryController.createCategory
);

router.patch(
  '/:categoryId', 
  authenticate, 
  requirePermissions('MANAGE_INVENTORY'), 
  categoryController.updateCategory
);

router.delete(
  '/:categoryId', 
  authenticate, 
  requirePermissions('MANAGE_INVENTORY'), 
  categoryController.deleteCategory
);

export default router;

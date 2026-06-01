import { Router } from 'express';
import inventoryController from '../controllers/inventory.controller.js';
import { authenticate, requirePermissions } from '../../middlewares/auth.middleware.js';

const router = Router();

// Protect all warehouse inventory paths with JWT Auth & MANAGE_INVENTORY scope
router.use(authenticate);
router.use(requirePermissions('MANAGE_INVENTORY'));

router.get('/:productId', inventoryController.getProductInventory);
router.patch('/:productId', inventoryController.updateAvailableStock);

export default router;

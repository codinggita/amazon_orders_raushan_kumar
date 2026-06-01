import { Router } from 'express';
import adminController from '../controllers/admin.controller.js';
import { authenticate, requirePermissions } from '../../middlewares/auth.middleware.js';

const router = Router();

// Secure all endpoints to verified Admins (possessing the ADMIN/SUPER_ADMIN role or VIEW_ANALYTICS permission scope)
router.use(authenticate);
router.use(requirePermissions('VIEW_ANALYTICS')); // Admin scope

router.get('/users', adminController.getUsers);
router.get('/system-metrics', adminController.getSystemMetrics);
router.patch('/users/:userId/block', adminController.blockUser);
router.patch('/users/:userId/unblock', adminController.unblockUser);

export default router;

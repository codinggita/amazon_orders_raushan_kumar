import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { authenticate, requirePermissions } from '../../middlewares/auth.middleware.js';
import ApiResponse from '../../utils/apiResponse.js';

const router = Router();

// Public Authentication Endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected Core Session Endpoints
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);
router.patch('/change-password', authenticate, authController.changePassword);

// Granular Scope Gating Verification Test Endpoint
router.get(
  '/admin-test', 
  authenticate, 
  requirePermissions('VIEW_ANALYTICS'), 
  (req, res) => {
    res.status(200).json(
      new ApiResponse(200, { authorized: true, permissions: req.user.permissions }, 'Administrative authorization check succeeded.')
    );
  }
);

export default router;

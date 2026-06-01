import { Router } from 'express';
import healthController from '../controllers/health.controller.js';

const router = Router();

// Public monitoring routes for verification & deployment checks
router.get('/', healthController.getHealth);
router.get('/db', healthController.getDbHealth);

export default router;

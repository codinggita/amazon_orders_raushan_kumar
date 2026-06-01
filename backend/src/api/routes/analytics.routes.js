import { Router } from 'express';
import analyticsController from '../controllers/analytics.controller.js';
import { authenticate, requirePermissions } from '../../middlewares/auth.middleware.js';

const router = Router();

// Expose dashboards to authenticated staff carrying the VIEW_ANALYTICS permission scope
router.use(authenticate);
router.use(requirePermissions('VIEW_ANALYTICS'));

router.get('/dashboard', analyticsController.getDashboard);
router.get('/revenue', analyticsController.getRevenue);
router.get('/top-products', analyticsController.getTopProducts);
router.get('/top-customers', analyticsController.getTopCustomers);
router.get('/category-sales', analyticsController.getCategorySales);
router.get('/brand-sales', analyticsController.getBrandSales);
router.get('/country-sales', analyticsController.getCountrySales);
router.get('/state-sales', analyticsController.getStateSales);
router.get('/city-sales', analyticsController.getCitySales);
router.get('/payment-distribution', analyticsController.getPaymentDistribution);
router.get('/order-status', analyticsController.getOrderStatusSpread);
router.get('/seller-performance', analyticsController.getSellerPerformance);

export default router;

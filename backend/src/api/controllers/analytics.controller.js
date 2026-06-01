import analyticsService from '../../domain/services/analytics.service.js';
import ApiResponse from '../../utils/apiResponse.js';

/**
 * AnalyticsController acts as the HTTP orchestrator for secure commerce intelligence reporting.
 */
class AnalyticsController {
  /**
   * Handle dashboard request queries
   */
  getDashboard = async (req, res, next) => {
    try {
      const dashboard = await analyticsService.getCommerceDashboard(req.query);
      res.status(200).json(new ApiResponse(200, dashboard, 'Commerce intelligence analytics dashboard compiled.'));
    } catch (error) {
      next(error);
    }
  };

  getRevenue = async (req, res, next) => {
    try {
      const metrics = await analyticsService.getRevenueMetrics(req.query);
      res.status(200).json(new ApiResponse(200, metrics, 'Revenue analytics metrics resolved.'));
    } catch (error) {
      next(error);
    }
  };

  getTopProducts = async (req, res, next) => {
    try {
      const metrics = await analyticsService.getTopProducts(req.query);
      res.status(200).json(new ApiResponse(200, metrics, 'Top performing products catalog resolved.'));
    } catch (error) {
      next(error);
    }
  };

  getTopCustomers = async (req, res, next) => {
    try {
      const metrics = await analyticsService.getTopCustomers(req.query);
      res.status(200).json(new ApiResponse(200, metrics, 'Top spending shoppers resolved.'));
    } catch (error) {
      next(error);
    }
  };

  getCategorySales = async (req, res, next) => {
    try {
      const metrics = await analyticsService.getCategorySales(req.query);
      res.status(200).json(new ApiResponse(200, metrics, 'Taxonomy category sales metrics resolved.'));
    } catch (error) {
      next(error);
    }
  };

  getBrandSales = async (req, res, next) => {
    try {
      const metrics = await analyticsService.getBrandSales(req.query);
      res.status(200).json(new ApiResponse(200, metrics, 'Brand sales performance metrics resolved.'));
    } catch (error) {
      next(error);
    }
  };

  getCountrySales = async (req, res, next) => {
    try {
      const metrics = await analyticsService.getCountrySales(req.query);
      res.status(200).json(new ApiResponse(200, metrics, 'Country geographic revenue metrics resolved.'));
    } catch (error) {
      next(error);
    }
  };

  getStateSales = async (req, res, next) => {
    try {
      const metrics = await analyticsService.getStateSales(req.query);
      res.status(200).json(new ApiResponse(200, metrics, 'State geographic revenue metrics resolved.'));
    } catch (error) {
      next(error);
    }
  };

  getCitySales = async (req, res, next) => {
    try {
      const metrics = await analyticsService.getCitySales(req.query);
      res.status(200).json(new ApiResponse(200, metrics, 'City geographic revenue metrics resolved.'));
    } catch (error) {
      next(error);
    }
  };

  getPaymentDistribution = async (req, res, next) => {
    try {
      const metrics = await analyticsService.getPaymentDistribution(req.query);
      res.status(200).json(new ApiResponse(200, metrics, 'Payment methods transactional spread resolved.'));
    } catch (error) {
      next(error);
    }
  };

  getOrderStatusSpread = async (req, res, next) => {
    try {
      const metrics = await analyticsService.getOrderStatusSpread(req.query);
      res.status(200).json(new ApiResponse(200, metrics, 'Order statuses lifecycle spread resolved.'));
    } catch (error) {
      next(error);
    }
  };

  getSellerPerformance = async (req, res, next) => {
    try {
      const metrics = await analyticsService.getSellerPerformance(req.query);
      res.status(200).json(new ApiResponse(200, metrics, 'Merchant performance benchmarks resolved.'));
    } catch (error) {
      next(error);
    }
  };
}

export default new AnalyticsController();
export { AnalyticsController };

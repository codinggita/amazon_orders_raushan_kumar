import sellerService from '../../domain/services/seller.service.js';
import ApiResponse from '../../utils/apiResponse.js';
import ApiError from '../../utils/apiError.js';

/**
 * SellerController acts as the HTTP orchestrator for merchant catalog and performance telemetry.
 */
class SellerController {
  /**
   * Fetch a list of active merchants
   */
  getSellers = async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const result = await sellerService.getSellers({ page, limit });

      res.status(200).json(
        new ApiResponse(200, result.sellers, 'Registered merchants listed.', result.pagination)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch storefront merchant details
   */
  getSeller = async (req, res, next) => {
    try {
      const { sellerId } = req.params;
      const seller = await sellerService.getSellerById(sellerId);

      res.status(200).json(
        new ApiResponse(200, seller, 'Merchant storefront details resolved.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch all products supplied by a specific merchant
   */
  getSellerProducts = async (req, res, next) => {
    try {
      const { sellerId } = req.params;
      const products = await sellerService.getSellerProducts(sellerId);

      res.status(200).json(
        new ApiResponse(200, products, 'Merchant catalog products index fetched.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch merchant performance sales dashboard
   */
  getSellerAnalytics = async (req, res, next) => {
    try {
      const { sellerId } = req.params;

      // Ownership or staff assertion
      const isOwner = req.user.userId === sellerId;
      const hasStaffScope = ['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_MANAGER'].includes(req.user.role);

      if (!isOwner && !hasStaffScope) {
        throw new ApiError(403, 'Access denied. You do not possess permissions to view this merchant analytics reports.', 'INSUFFICIENT_PERMISSIONS');
      }

      const analytics = await sellerService.getSellerAnalytics(sellerId);

      res.status(200).json(
        new ApiResponse(200, analytics, 'Merchant sales telemetry dashboard compiled.')
      );
    } catch (error) {
      next(error);
    }
  };
}

export default new SellerController();
export { SellerController };

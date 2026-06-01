import customerService from '../../domain/services/customer.service.js';
import ApiResponse from '../../utils/apiResponse.js';
import ApiError from '../../utils/apiError.js';

/**
 * CustomerController acts as the HTTP orchestrator for buyer account lifecycles.
 */
class CustomerController {
  /**
   * Fetch registered shopper listings (restricted to Staff/Admins)
   */
  getCustomers = async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const result = await customerService.getCustomers({ page, limit });

      res.status(200).json(
        new ApiResponse(200, result.customers, 'Shopper accounts listed.', result.pagination)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch shopper profile details
   */
  getCustomer = async (req, res, next) => {
    try {
      const { customerId } = req.params;
      
      // Ownership assertion
      const isOwner = req.user.userId === customerId;
      const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'SUPPORT_AGENT'].includes(req.user.role);
      
      if (!isOwner && !isAdmin) {
        throw new ApiError(403, 'Access denied. You do not possess ownership permissions to view this profile.', 'INSUFFICIENT_PERMISSIONS');
      }

      const customer = await customerService.getCustomerById(customerId);

      res.status(200).json(
        new ApiResponse(200, customer, 'Shopper profile resolved.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update shopper profile details
   */
  updateCustomer = async (req, res, next) => {
    try {
      const { customerId } = req.params;
      
      // Ownership assertion
      const isOwner = req.user.userId === customerId;
      if (!isOwner) {
        throw new ApiError(403, 'Access denied. You can only modify your own account profile.', 'INSUFFICIENT_PERMISSIONS');
      }

      const updated = await customerService.updateCustomer(customerId, req.body);

      res.status(200).json(
        new ApiResponse(200, updated, 'Shopper profile successfully updated.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Deactivate customer profile (soft-delete status)
   */
  deleteCustomer = async (req, res, next) => {
    try {
      const { customerId } = req.params;

      // Ownership or staff assertion
      const isOwner = req.user.userId === customerId;
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

      if (!isOwner && !isAdmin) {
        throw new ApiError(403, 'Access denied. You can only deactivate your own account profile.', 'INSUFFICIENT_PERMISSIONS');
      }

      await customerService.deleteCustomer(customerId);

      res.status(200).json(
        new ApiResponse(200, null, 'Shopper account deactivated successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch customer order logs (frequently asked database query)
   */
  getCustomerOrders = async (req, res, next) => {
    try {
      const { customerId } = req.params;

      // Ownership or staff assertion
      const isOwner = req.user.userId === customerId;
      const hasStaffScope = ['ADMIN', 'SUPER_ADMIN', 'SUPPORT_AGENT', 'ANALYTICS_MANAGER'].includes(req.user.role);

      if (!isOwner && !hasStaffScope) {
        throw new ApiError(403, 'Access denied. You do not possess permissions to view this shopper orders history.', 'INSUFFICIENT_PERMISSIONS');
      }

      const orders = await customerService.getCustomerOrders(customerId);

      res.status(200).json(
        new ApiResponse(200, orders, 'Shopper order history logs compiled.')
      );
    } catch (error) {
      next(error);
    }
  };
}

export default new CustomerController();
export { CustomerController };

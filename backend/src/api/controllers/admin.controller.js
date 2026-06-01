import adminService from '../../domain/services/admin.service.js';
import ApiResponse from '../../utils/apiResponse.js';

/**
 * AdminController orchestrates request data flow for system management.
 */
class AdminController {
  getUsers = async (req, res, next) => {
    try {
      const result = await adminService.getUsers(req.query);
      res.status(200).json(
        new ApiResponse(200, result.users, 'Administrative directory listing resolved.', result.pagination)
      );
    } catch (error) {
      next(error);
    }
  };

  blockUser = async (req, res, next) => {
    try {
      const { userId } = req.params;
      const updated = await adminService.blockUser(userId);
      res.status(200).json(
        new ApiResponse(200, updated, `User ID "${userId}" has been successfully suspended.`)
      );
    } catch (error) {
      next(error);
    }
  };

  unblockUser = async (req, res, next) => {
    try {
      const { userId } = req.params;
      const updated = await adminService.unblockUser(userId);
      res.status(200).json(
        new ApiResponse(200, updated, `User ID "${userId}" suspension has been lifted.`)
      );
    } catch (error) {
      next(error);
    }
  };

  getSystemMetrics = async (req, res, next) => {
    try {
      const metrics = await adminService.getSystemMetrics();
      res.status(200).json(
        new ApiResponse(200, metrics, 'Global backend diagnostic metrics resolved.')
      );
    } catch (error) {
      next(error);
    }
  };
}

export default new AdminController();
export { AdminController };

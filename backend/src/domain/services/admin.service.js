import User from '../../infrastructure/database/models/user.model.js';
import mongoose from 'mongoose';
import ApiError from '../../utils/apiError.js';
import os from 'os';

/**
 * AdminService manages user directory status and global backend diagnostics.
 */
class AdminService {
  /**
   * List all registered users paginated
   */
  async getUsers(queryParams) {
    const { page, limit, role } = queryParams;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (role) {
      query.role = role;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .exec(),
      User.countDocuments(query).exec()
    ]);

    return {
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };
  }

  /**
   * Set user account status to block (SUSPENDED)
   */
  async blockUser(userId) {
    const user = await User.findOne({ userId });
    if (!user) {
      throw new ApiError(404, `User ID "${userId}" could not be resolved.`, 'USER_NOT_FOUND');
    }

    user.accountStatus = 'SUSPENDED';
    return user.save();
  }

  /**
   * Set user account status to active (ACTIVE)
   */
  async unblockUser(userId) {
    const user = await User.findOne({ userId });
    if (!user) {
      throw new ApiError(404, `User ID "${userId}" could not be resolved.`, 'USER_NOT_FOUND');
    }

    user.accountStatus = 'ACTIVE';
    return user.save();
  }

  /**
   * System health metrics overview (Express uptime, memory and DB connectivity pings)
   */
  async getSystemMetrics() {
    const activeConnection = mongoose.connection.readyState === 1;
    let pingTime = 0;

    if (activeConnection) {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      pingTime = Date.now() - start;
    }

    return {
      system: {
        platform: os.platform(),
        architecture: os.arch(),
        uptime: Math.round(process.uptime()),
        memoryUsage: {
          free: os.freemem(),
          total: os.totalmem(),
          percentageUsed: parseFloat(((1 - os.freemem() / os.totalmem()) * 100).toFixed(2))
        },
        nodeVersion: process.version
      },
      database: {
        status: activeConnection ? 'CONNECTED' : 'DISCONNECTED',
        latencyMs: pingTime
      }
    };
  }
}

export default new AdminService();
export { AdminService };

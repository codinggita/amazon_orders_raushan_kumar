import mongoose from 'mongoose';
import env from '../../configs/env.config.js';
import ApiResponse from '../../utils/apiResponse.js';
import ApiError from '../../utils/apiError.js';

/**
 * HealthController handles infrastructure monitoring, resource footprint checks,
 * and database connection latency telemetry.
 */
class HealthController {
  /**
   * GET /api/v1/health
   * High-level verification of server status, memory overhead, and uptime.
   */
  getHealth = async (req, res, next) => {
    try {
      const connectionState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
      const dbStatus = mongoose.connection.readyState;

      const memoryUsage = process.memoryUsage();
      const stats = {
        status: dbStatus === 1 ? 'UP' : 'DEGRADED',
        environment: env.nodeEnv,
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        system: {
          platform: process.platform,
          nodeVersion: process.version,
          memoryFootprintMB: {
            rss: Math.round(memoryUsage.rss / 1024 / 1024),
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          }
        },
        database: {
          status: dbStatus === 1 ? 'CONNECTED' : 'DISCONNECTED',
          state: connectionState[dbStatus] || 'unknown',
        }
      };

      const httpStatus = dbStatus === 1 ? 200 : 503;
      res.status(httpStatus).json(
        new ApiResponse(httpStatus, stats, 'System deployment health is operational.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/health/db
   * Runs an active admin ping command on the MongoDB instance to record cluster latency.
   */
  getDbHealth = async (req, res, next) => {
    try {
      const dbStatus = mongoose.connection.readyState;
      if (dbStatus !== 1) {
        throw new ApiError(503, 'Database pool is offline or disconnected.', 'DATABASE_OFFLINE');
      }

      const start = Date.now();
      
      // Execute active cluster ping check to measure latency
      const adminDb = mongoose.connection.db.admin();
      await adminDb.ping();
      
      const latencyMs = Date.now() - start;

      const telemetry = {
        status: 'CONNECTED',
        latencyMs,
        databaseName: mongoose.connection.name,
        poolDetails: {
          host: mongoose.connection.host,
          port: mongoose.connection.port
        }
      };

      res.status(200).json(
        new ApiResponse(200, telemetry, 'Database monitoring telemetry compiled.')
      );
    } catch (error) {
      next(new ApiError(503, `Database ping check failed: ${error.message}`, 'DATABASE_PING_FAILED', [], error.stack));
    }
  };
}

export default new HealthController();
export { HealthController };

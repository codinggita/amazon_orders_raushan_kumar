import jwt from 'jsonwebtoken';
import env from '../configs/env.config.js';
import ApiError from '../utils/apiError.js';

/**
 * Middleware: Verify presence of structurally sound and active JWT in request headers.
 * Attaches decoded identity profile to the Request context.
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Access denied. Authorization token is missing or malformed.', 'AUTHENTICATION_REQUIRED');
    }

    const token = authHeader.split(' ')[1];
    
    let decoded;
    try {
      decoded = jwt.verify(token, env.security.jwtSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Authorization token has expired. Please refresh your session.', 'TOKEN_EXPIRED');
      }
      throw new ApiError(401, 'Authorization token is invalid.', 'INVALID_TOKEN');
    }

    // Attach identity to the Express request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || []
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Enforce scoped permission assertions.
 * Prefer permission verification (e.g. 'MANAGE_INVENTORY') over generic role strings.
 * @param {...string} requiredPermissions - Permissions that are strictly required for accessing the endpoint
 */
export const requirePermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication is required to access this resource.', 'AUTHENTICATION_REQUIRED');
      }

      // Check if user contains the requested permissions
      const userPermissions = req.user.permissions || [];
      
      // ADMIN or SUPER_ADMIN roles are granted automatic access bypass for administrative speed
      const hasAdminBypass = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
      
      if (hasAdminBypass) {
        return next();
      }

      const hasAllRequired = requiredPermissions.every((perm) => userPermissions.includes(perm));
      if (!hasAllRequired) {
        throw new ApiError(403, 'Access denied. You do not possess the required scopes to access this resource.', 'INSUFFICIENT_PERMISSIONS');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default {
  authenticate,
  requirePermissions
};

import authService from '../../domain/services/auth.service.js';
import ApiResponse from '../../utils/apiResponse.js';
import ApiError from '../../utils/apiError.js';

/**
 * AuthController acts as the HTTP orchestrator for secure session management.
 * Strictly decoupled from database/business details.
 */
class AuthController {
  /**
   * Handle user signup/register request
   */
  register = async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password || !firstName || !lastName) {
        throw new ApiError(400, 'All registration fields (email, password, firstName, lastName) are required.', 'VALIDATION_FAILED');
      }

      const user = await authService.signup({ email, password, firstName, lastName });
      
      res.status(201).json(
        new ApiResponse(201, user, 'User registration completed successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle user authentication credentials check and JWT issuance
   */
  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        throw new ApiError(400, 'Both email address and password are required credentials.', 'VALIDATION_FAILED');
      }

      const session = await authService.login(email, password);
      
      res.status(200).json(
        new ApiResponse(200, session, 'Login authenticated and session created.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle token rotation/rotation of credentials sessions
   */
  refresh = async (req, res, next) => {
    try {
      const { userId, refreshToken } = req.body;
      
      if (!userId || !refreshToken) {
        throw new ApiError(400, 'Both userId and active refreshToken parameters must be supplied to rotate sessions.', 'VALIDATION_FAILED');
      }

      const tokens = await authService.refreshSession(userId, refreshToken);
      
      res.status(200).json(
        new ApiResponse(200, tokens, 'Access token rotated successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Terminate active user sessions and clear persistent tokens
   */
  logout = async (req, res, next) => {
    try {
      // req.user is attached by the authenticate middleware
      const userId = req.user.userId;
      
      await authService.logout(userId);
      
      res.status(200).json(
        new ApiResponse(200, null, 'Active session terminated and logout completed successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Simple secure endpoint to verify authorization scopes
   */
  getMe = async (req, res, next) => {
    try {
      res.status(200).json(
        new ApiResponse(200, req.user, 'Authorized user profile fetched.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Modify user credentials
   */
  changePassword = async (req, res, next) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.userId;

      await authService.changePassword(userId, oldPassword, newPassword);

      res.status(200).json(
        new ApiResponse(200, null, 'Credentials updated successfully.')
      );
    } catch (error) {
      next(error);
    }
  };
}

export default new AuthController();
export { AuthController };

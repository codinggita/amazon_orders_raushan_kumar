import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import userRepository from '../repositories/user.repository.js';
import env from '../../configs/env.config.js';
import ApiError from '../../utils/apiError.js';

/**
 * AuthService implements high-level identity validation, password cryptography matching,
 * brute-force lockout safeguards, and secure session state transitions (tokens).
 */
class AuthService {
  /**
   * Register a new user into the commerce network
   * @param {Object} input - Sign up details
   */
  async signup(input) {
    const { email, password, firstName, lastName, role } = input;
    
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ApiError(400, 'An account with this email address already exists.', 'EMAIL_ALREADY_EXISTS');
    }
    
    // Construct high-entropy userId prefix to avoid sequential guess attacks
    const userId = `usr_${crypto.randomUUID().replace(/-/g, '')}`;
    
    // Default roles to CUSTOMER. Prevent security elevation unless explicitly configured
    const userRole = role && ['ADMIN', 'SUPER_ADMIN', 'SELLER'].includes(role) ? 'CUSTOMER' : (role || 'CUSTOMER');
    
    const user = await userRepository.create({
      userId,
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      role: userRole,
      permissions: userRole === 'CUSTOMER' ? ['CREATE_ORDER', 'VIEW_PRODUCTS'] : ['VIEW_PRODUCTS']
    });
    
    return {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }

  /**
   * Verify credentials and issue active JWT sessions
   * @param {string} email - Email address
   * @param {string} password - Raw password input
   */
  async login(email, password) {
    const user = await userRepository.findByEmail(email, true);
    if (!user) {
      // General error to prevent user enumeration attacks
      throw new ApiError(401, 'Invalid email address or password.', 'INVALID_CREDENTIALS');
    }

    // Check brute-force lockout state
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      throw new ApiError(423, `This account is temporarily locked due to excessive failed attempts. Try again in ${remainingMinutes} minutes.`, 'ACCOUNT_LOCKED');
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment failed count to mitigate brute-force guessing
      await user.handleFailedLogin();
      throw new ApiError(401, 'Invalid email address or password.', 'INVALID_CREDENTIALS');
    }

    // Reset failed count upon successful login
    await user.resetFailedAttempts();

    // Check account status
    if (user.accountStatus === 'SUSPENDED') {
      throw new ApiError(403, 'Your account has been suspended. Please contact support.', 'ACCOUNT_SUSPENDED');
    }

    // Generate JWT sessions
    const tokens = await this._generateSessionTokens(user);
    
    // Persist refresh token to database for single-device tracking / revocation support
    await userRepository.saveRefreshToken(user.userId, tokens.refreshToken);

    return {
      user: {
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        permissions: user.permissions
      },
      tokens
    };
  }

  /**
   * Verify and refresh user access session
   * @param {string} userId - Domain userId
   * @param {string} refreshToken - Active refresh token
   */
  async refreshSession(userId, refreshToken) {
    // 1. Verify structure and signature of refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, env.security.jwtSecret);
    } catch (error) {
      throw new ApiError(401, 'Active session token has expired or is invalid.', 'INVALID_SESSION_TOKEN');
    }

    // Ensure the token payload matches user request
    if (decoded.userId !== userId) {
      throw new ApiError(401, 'Session token mismatch detected.', 'SESSION_MISMATCH');
    }

    // 2. Validate token against persisted store
    const storedToken = await userRepository.getRefreshToken(userId);
    if (!storedToken || storedToken !== refreshToken) {
      throw new ApiError(401, 'Session token has been revoked or is no longer active.', 'SESSION_REVOKED');
    }

    const user = await userRepository.findById(userId);
    if (!user || user.accountStatus === 'SUSPENDED') {
      throw new ApiError(403, 'Active user session belongs to a suspended or invalid account.', 'ACCOUNT_DISABLED');
    }

    // 3. Issue fresh tokens (rolling session strategy)
    const tokens = await this._generateSessionTokens(user);
    
    // Update store with new refresh token
    await userRepository.saveRefreshToken(user.userId, tokens.refreshToken);

    return tokens;
  }

  /**
   * Log out active session
   * @param {string} userId - User domain identifier
   */
  async logout(userId) {
    await userRepository.clearRefreshToken(userId);
    return true;
  }

  /**
   * Modify user credentials
   * @param {string} userId - Target user domain identifier
   * @param {string} oldPassword - Existing password input
   * @param {string} newPassword - New password input
   */
  async changePassword(userId, oldPassword, newPassword) {
    if (!oldPassword || !newPassword) {
      throw new ApiError(400, 'Both old and new password fields are required.', 'VALIDATION_FAILED');
    }

    if (newPassword.length < 8) {
      throw new ApiError(400, 'New password must be at least 8 characters long.', 'VALIDATION_FAILED');
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User account could not be found.', 'USER_NOT_FOUND');
    }

    const userWithPassword = await userRepository.findByEmail(user.email, true);
    const isPasswordValid = await userWithPassword.comparePassword(oldPassword);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Current password verification failed.', 'INVALID_CREDENTIALS');
    }

    userWithPassword.password = newPassword;
    await userWithPassword.save();
    return true;
  }

  /**
   * Internal Helper to construct matching JWT pairs
   * @private
   */
  async _generateSessionTokens(user) {
    const payload = {
      userId: user.userId,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    };

    const accessToken = jwt.sign(
      payload,
      env.security.jwtSecret,
      { expiresIn: env.security.jwtAccessExpiration }
    );

    const refreshToken = jwt.sign(
      { userId: user.userId },
      env.security.jwtSecret,
      { expiresIn: env.security.jwtRefreshExpiration }
    );

    return {
      accessToken,
      refreshToken
    };
  }
}

export default new AuthService();
export { AuthService };

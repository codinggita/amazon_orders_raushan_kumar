/**
 * Custom operational API Error class representing predictable application-level errors
 * and encapsulating HTTP status codes and trace stacks.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 403, 404)
   * @param {string} message - Human-readable error explanation
   * @param {string} [errorCode='INTERNAL_SERVER_ERROR'] - Centralized machine-readable error token
   * @param {Array} [errors=[]] - Array containing granular error contexts (e.g., validation issues)
   * @param {string} [stack=''] - Custom stack trace override if present
   */
  constructor(statusCode, message, errorCode = 'INTERNAL_SERVER_ERROR', errors = [], stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
    this.success = false;
    this.isOperational = true; // Signals that this is a safe, predicted runtime error

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
export { ApiError };

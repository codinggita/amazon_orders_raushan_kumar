/**
 * Standard ApiResponse helper class to build consistent success responses
 * across all Express controllers.
 */
class ApiResponse {
  /**
   * @param {number} statusCode - HTTP success status code (e.g. 200, 201)
   * @param {*} data - Payload returned by the operation
   * @param {string} [message='Success'] - Descriptive summary of the operation
   * @param {Object} [pagination=null] - Optional pagination state
   * @param {number} [pagination.page] - Current page number
   * @param {number} [pagination.limit] - Page size limit
   * @param {number} [pagination.total] - Total number of matching documents
   * @param {number} [pagination.pages] - Total calculated pages
   */
  constructor(statusCode, data, message = 'Success', pagination = null) {
    this.success = true;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    
    if (pagination) {
      this.pagination = {
        page: Number(pagination.page),
        limit: Number(pagination.limit),
        total: Number(pagination.total),
        pages: Number(pagination.pages) || Math.ceil(Number(pagination.total) / Number(pagination.limit)) || 1
      };
    }
  }
}

export default ApiResponse;
export { ApiResponse };

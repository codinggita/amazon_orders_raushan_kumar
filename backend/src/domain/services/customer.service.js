import customerRepository from '../repositories/customer.repository.js';
import ApiError from '../../utils/apiError.js';

/**
 * CustomerService coordinates shopper lookup profiles and transaction indexes.
 */
class CustomerService {
  /**
   * List registered customers
   */
  async getCustomers(queryParams) {
    const { page, limit } = queryParams;
    return customerRepository.findAll({ page, limit });
  }

  /**
   * Fetch customer profile details
   */
  async getCustomerById(customerId) {
    const customer = await customerRepository.findById(customerId);
    if (!customer) {
      throw new ApiError(404, `Customer with ID "${customerId}" does not exist.`, 'CUSTOMER_NOT_FOUND');
    }
    return customer;
  }

  /**
   * Update customer profile attributes
   */
  async updateCustomer(customerId, updateData) {
    const customer = await customerRepository.findById(customerId);
    if (!customer) {
      throw new ApiError(404, `Customer with ID "${customerId}" does not exist.`, 'CUSTOMER_NOT_FOUND');
    }

    // Do not allow roles or security scopes updates inside shopper endpoints
    delete updateData.role;
    delete updateData.permissions;
    delete updateData.password;

    return customerRepository.update(customerId, updateData);
  }

  /**
   * Deactivate a customer shopper profile
   */
  async deleteCustomer(customerId) {
    const customer = await customerRepository.deactivate(customerId);
    if (!customer) {
      throw new ApiError(404, `Customer with ID "${customerId}" does not exist.`, 'CUSTOMER_NOT_FOUND');
    }
    return true;
  }

  /**
   * Fetch complete order history for a shopper
   */
  async getCustomerOrders(customerId) {
    const customer = await customerRepository.findById(customerId);
    if (!customer) {
      throw new ApiError(404, `Customer with ID "${customerId}" could not be resolved.`, 'CUSTOMER_NOT_FOUND');
    }
    return customerRepository.findOrders(customerId);
  }
}

export default new CustomerService();
export { CustomerService };

import sellerRepository from '../repositories/seller.repository.js';
import ApiError from '../../utils/apiError.js';

/**
 * SellerService coordinates merchant catalog listings and localized performance indices.
 */
class SellerService {
  /**
   * Fetch registered merchant list
   */
  async getSellers(queryParams) {
    const { page, limit } = queryParams;
    return sellerRepository.findAll({ page, limit });
  }

  /**
   * Resolve a merchant profile
   */
  async getSellerById(sellerId) {
    const seller = await sellerRepository.findById(sellerId);
    if (!seller) {
      throw new ApiError(404, `Seller with ID "${sellerId}" does not exist.`, 'SELLER_NOT_FOUND');
    }
    return seller;
  }

  /**
   * List all active catalog products supplied by a specific merchant
   */
  async getSellerProducts(sellerId) {
    const seller = await sellerRepository.findById(sellerId);
    if (!seller) {
      throw new ApiError(404, `Seller with ID "${sellerId}" does not exist.`, 'SELLER_NOT_FOUND');
    }
    return sellerRepository.findProductsBySeller(sellerId);
  }

  /**
   * Compile merchant analytics performance dashboard
   */
  async getSellerAnalytics(sellerId) {
    const seller = await sellerRepository.findById(sellerId);
    if (!seller) {
      throw new ApiError(404, `Seller with ID "${sellerId}" does not exist.`, 'SELLER_NOT_FOUND');
    }
    return sellerRepository.getSellerAnalytics(sellerId);
  }
}

export default new SellerService();
export { SellerService };

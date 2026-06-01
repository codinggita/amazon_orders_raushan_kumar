import productRepository from '../repositories/product.repository.js';
import ApiError from '../../utils/apiError.js';

/**
 * InventoryService coordinates secure warehousing operations and stock validation overrides.
 */
class InventoryService {
  /**
   * Get inventory metrics for a product
   */
  async getProductInventory(productId) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new ApiError(404, `Product with ID "${productId}" could not be resolved.`, 'PRODUCT_NOT_FOUND');
    }

    return {
      productId: product.identity.productId,
      sku: product.identity.sku,
      name: product.core.name,
      inventory: product.inventory
    };
  }

  /**
   * Overwrite active available stock levels manually
   */
  async updateAvailableStock(productId, input) {
    const { availableStock, reorderThreshold, damagedStock } = input;

    const product = await productRepository.findById(productId);
    if (!product) {
      throw new ApiError(404, `Product with ID "${productId}" could not be resolved.`, 'PRODUCT_NOT_FOUND');
    }

    const updates = {};
    if (availableStock !== undefined) {
      if (availableStock < 0) {
        throw new ApiError(400, 'Available stock level cannot be negative.', 'VALIDATION_FAILED');
      }
      updates['inventory.availableStock'] = availableStock;
    }

    if (reorderThreshold !== undefined) {
      if (reorderThreshold < 0) {
        throw new ApiError(400, 'Reorder threshold cannot be negative.', 'VALIDATION_FAILED');
      }
      updates['inventory.reorderThreshold'] = reorderThreshold;
    }

    if (damagedStock !== undefined) {
      if (damagedStock < 0) {
        throw new ApiError(400, 'Damaged stock level cannot be negative.', 'VALIDATION_FAILED');
      }
      updates['inventory.damagedStock'] = damagedStock;
    }

    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, 'No valid inventory updates provided.', 'VALIDATION_FAILED');
    }

    // Perform update
    const updatedProduct = await productRepository.update(productId, updates);
    return {
      productId: updatedProduct.identity.productId,
      sku: updatedProduct.identity.sku,
      name: updatedProduct.core.name,
      inventory: updatedProduct.inventory
    };
  }
}

export default new InventoryService();
export { InventoryService };

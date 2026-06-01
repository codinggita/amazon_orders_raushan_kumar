import inventoryService from '../../domain/services/inventory.service.js';
import ApiResponse from '../../utils/apiResponse.js';

/**
 * InventoryController acts as the HTTP orchestrator for secure warehousing/stock management operations.
 */
class InventoryController {
  /**
   * Fetch current inventory metrics
   */
  getProductInventory = async (req, res, next) => {
    try {
      const { productId } = req.params;
      const metrics = await inventoryService.getProductInventory(productId);

      res.status(200).json(
        new ApiResponse(200, metrics, 'Warehouse stock metrics resolved.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Manually override available stock and inventory levels
   */
  updateAvailableStock = async (req, res, next) => {
    try {
      const { productId } = req.params;
      const metrics = await inventoryService.updateAvailableStock(productId, req.body);

      res.status(200).json(
        new ApiResponse(200, metrics, 'Warehouse stock metrics successfully updated.')
      );
    } catch (error) {
      next(error);
    }
  };
}

export default new InventoryController();
export { InventoryController };

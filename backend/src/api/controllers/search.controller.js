import searchService from '../../domain/services/search.service.js';
import ApiResponse from '../../utils/apiResponse.js';

/**
 * SearchController coordinates full-text index queries.
 */
class SearchController {
  searchProducts = async (req, res, next) => {
    try {
      const result = await searchService.searchProducts(req.query);
      res.status(200).json(
        new ApiResponse(200, result.products, 'Catalog query results compiled.', result.pagination)
      );
    } catch (error) {
      next(error);
    }
  };

  searchOrders = async (req, res, next) => {
    try {
      const result = await searchService.searchOrders(req.query);
      res.status(200).json(
        new ApiResponse(200, result.orders, 'Orders query results compiled.', result.pagination)
      );
    } catch (error) {
      next(error);
    }
  };
}

export default new SearchController();
export { SearchController };

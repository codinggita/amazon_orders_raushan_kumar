import searchService from '../../domain/services/search.service.js';
import ApiResponse from '../../utils/apiResponse.js';

/**
 * SearchController coordinates full-text index queries, autocomplete, and analytics.
 */
class SearchController {
  searchProducts = async (req, res, next) => {
    try {
      const result = await searchService.searchProducts(req.query);
      res.status(200).json(
        new ApiResponse(200, result.products, 'Catalog query results compiled.', {
          ...result.pagination,
          ...result.meta
        })
      );
    } catch (error) {
      next(error);
    }
  };

  autocomplete = async (req, res, next) => {
    try {
      const { q } = req.query;
      const result = await searchService.autocomplete(q);
      res.status(200).json(new ApiResponse(200, result.suggestions, 'Autocomplete suggestions compiled.', { resolvedPrefix: result.resolvedPrefix }));
    } catch (error) {
      next(error);
    }
  };

  getSearchAnalytics = async (req, res, next) => {
    try {
      const result = await searchService.getAnalytics();
      res.status(200).json(new ApiResponse(200, result, 'Search analytics compiled.'));
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

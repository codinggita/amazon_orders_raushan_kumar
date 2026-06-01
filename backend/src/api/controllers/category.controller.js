import categoryService from '../../domain/services/category.service.js';
import ApiResponse from '../../utils/apiResponse.js';
import ApiError from '../../utils/apiError.js';

/**
 * CategoryController acts as the HTTP orchestrator for the hierarchical taxonomy catalog.
 */
class CategoryController {
  /**
   * Create a new category node
   */
  createCategory = async (req, res, next) => {
    try {
      const { name, hierarchy, searchableTags, recommendationGroups } = req.body;

      if (!name || !hierarchy || !hierarchy.main) {
        throw new ApiError(400, 'All taxonomy parameters (name, hierarchy.main) are required.', 'VALIDATION_FAILED');
      }

      const category = await categoryService.createCategory({
        name,
        hierarchy,
        searchableTags,
        recommendationGroups
      });

      res.status(201).json(
        new ApiResponse(201, category, 'Taxonomy category node created successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all active categories in a flat list
   */
  getCategories = async (req, res, next) => {
    try {
      const categories = await categoryService.getActiveCategories();
      
      res.status(200).json(
        new ApiResponse(200, categories, 'Catalog categories retrieved successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch subcategories nested under a specific path
   * Path should be supplied as a comma-separated query param, e.g. ?path=Electronics,Audio
   */
  getSubcategories = async (req, res, next) => {
    try {
      const pathString = req.query.path;
      if (!pathString) {
        throw new ApiError(400, 'A comma-separated path parameter (?path=Electronics,Audio) is required.', 'VALIDATION_FAILED');
      }

      const pathArray = pathString.split(',').map((p) => p.trim());
      const subcategories = await categoryService.getSubcategories(pathArray);

      res.status(200).json(
        new ApiResponse(200, subcategories, `Subcategories for path "${pathString}" retrieved.`)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch category node by its ID
   */
  getCategoryById = async (req, res, next) => {
    try {
      const { categoryId } = req.params;
      const category = await categoryService.getCategoryById(categoryId);

      res.status(200).json(
        new ApiResponse(200, category, 'Category node resolved.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update category properties
   */
  updateCategory = async (req, res, next) => {
    try {
      const { categoryId } = req.params;
      const updated = await categoryService.updateCategory(categoryId, req.body);

      res.status(200).json(
        new ApiResponse(200, updated, 'Category node updated.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove category node from database
   */
  deleteCategory = async (req, res, next) => {
    try {
      const { categoryId } = req.params;
      await categoryService.deleteCategory(categoryId);

      res.status(200).json(
        new ApiResponse(200, null, 'Category node removed.')
      );
    } catch (error) {
      next(error);
    }
  };
}

export default new CategoryController();
export { CategoryController };

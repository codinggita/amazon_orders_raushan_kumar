import productService from '../../domain/services/product.service.js';
import ApiResponse from '../../utils/apiResponse.js';
import ApiError from '../../utils/apiError.js';

/**
 * ProductController coordinates catalog HTTP queries and commands.
 */
class ProductController {
  /**
   * Add a new product to the marketplace catalog
   */
  createProduct = async (req, res, next) => {
    try {
      const product = await productService.createProduct(req.body);
      
      res.status(201).json(
        new ApiResponse(210, product, 'Product added to the catalog successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search, filter, paginate and sort the catalog
   */
  getProducts = async (req, res, next) => {
    try {
      const { 
        page, 
        limit, 
        sortField, 
        sortOrder, 
        minPrice, 
        maxPrice, 
        categoryId, 
        brandId, 
        isPremium, 
        search 
      } = req.query;

      const result = await productService.queryCatalog({
        page,
        limit,
        sortField,
        sortOrder,
        minPrice,
        maxPrice,
        categoryId,
        brandId,
        isPremium,
        search
      });

      res.status(200).json(
        new ApiResponse(200, result.products, 'Catalog items fetched successfully.', result.pagination)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Resolve a single product profile by either custom ID or unique SEO slug
   */
  getProduct = async (req, res, next) => {
    try {
      const identifier = req.params.productId;
      
      let product;
      if (identifier.startsWith('prod_')) {
        product = await productService.getProductById(identifier);
      } else {
        product = await productService.getProductBySlug(identifier);
      }

      res.status(200).json(
        new ApiResponse(200, product, 'Product profile fetched successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update catalog details of a product
   */
  updateProduct = async (req, res, next) => {
    try {
      const productId = req.params.productId;
      const updated = await productService.updateProduct(productId, req.body);
      
      res.status(200).json(
        new ApiResponse(200, updated, 'Product catalog details updated successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove a product from active listings (soft-delete)
   */
  deleteProduct = async (req, res, next) => {
    try {
      const productId = req.params.productId;
      await productService.deleteProduct(productId);
      
      res.status(200).json(
        new ApiResponse(200, null, 'Product removed from active catalog successfully.')
      );
    } catch (error) {
      next(error);
    }
  };
}

export default new ProductController();
export { ProductController };

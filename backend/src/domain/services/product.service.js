import crypto from 'crypto';
import productRepository from '../repositories/product.repository.js';
import categoryRepository from '../repositories/category.repository.js';
import ApiError from '../../utils/apiError.js';

/**
 * ProductService coordinates product catalog operations, validating business criteria,
 * normalizing searchable keywords, and ensuring database consistency.
 */
class ProductService {
  /**
   * Add a new product to the catalog
   */
  async createProduct(input) {
    const { identity, core, category, brand, pricing, inventory, compliance } = input;

    if (!core || !core.name || !core.shortDescription) {
      throw new ApiError(400, 'Product name and short description core values are required.', 'VALIDATION_FAILED');
    }

    if (!pricing || pricing.basePrice === undefined) {
      throw new ApiError(400, 'Base pricing parameters are required.', 'VALIDATION_FAILED');
    }

    if (!category || !category.categoryId) {
      throw new ApiError(400, 'Product must be assigned to a valid categoryId.', 'VALIDATION_FAILED');
    }

    // 1. Verify category exists and inherit its path hierarchy details
    const categoryDoc = await categoryRepository.findById(category.categoryId);
    if (!categoryDoc) {
      throw new ApiError(404, `Assigned categoryId "${category.categoryId}" could not be resolved.`, 'CATEGORY_NOT_FOUND');
    }

    // 2. Generate unique identity fields if missing
    const productId = `prod_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;
    const sku = identity?.sku || `SKU-${core.name.toUpperCase().substring(0, 3)}-${crypto.randomInt(100000, 999999)}`;
    const slug = this._slugify(core.name);

    // Assert SKU is unique
    const existingSku = await productRepository.findBySku(sku);
    if (existingSku) {
      throw new ApiError(400, `A product with SKU "${sku}" already exists.`, 'SKU_ALREADY_EXISTS');
    }

    // Assert Slug is unique
    const existingSlug = await productRepository.findBySlug(slug);
    if (existingSlug) {
      throw new ApiError(400, `A product named "${core.name}" already exists.`, 'SLUG_ALREADY_EXISTS');
    }

    // 3. Compile Autocomplete & Searchable keywords for Typo tolerance
    const keywords = this._extractKeywords(core.name, core.shortDescription, categoryDoc.path);

    const productPayload = {
      identity: {
        productId,
        sku,
        slug,
        barcode: identity?.barcode,
        globalTradeItemNumber: identity?.globalTradeItemNumber
      },
      core: {
        name: core.name,
        shortDescription: core.shortDescription,
        fullDescription: core.fullDescription,
        technicalSpecifications: core.technicalSpecifications || {},
        dimensions: core.dimensions,
        material: core.material,
        weight: core.weight,
        images: core.images || [],
        variants: core.variants || []
      },
      category: {
        categoryId: categoryDoc.categoryId,
        hierarchy: categoryDoc.hierarchy,
        path: categoryDoc.path,
        searchableTags: categoryDoc.searchableTags,
        recommendationGroups: categoryDoc.recommendationGroups
      },
      brand: {
        brandId: brand?.brandId || `brd_${crypto.randomUUID().replace(/-/g, '').substring(0, 8)}`,
        name: brand?.name || 'GENERIC',
        country: brand?.country,
        isPremium: brand?.isPremium || false,
        officialStore: brand?.officialStore || false,
        trustScore: brand?.trustScore || 100
      },
      pricing: {
        basePrice: pricing.basePrice,
        currency: pricing.currency || 'USD',
        discount: pricing.discount,
        tax: pricing.tax,
        shippingCost: pricing.shippingCost || 0,
      },
      inventory: {
        availableStock: inventory?.availableStock || 0,
        reorderThreshold: inventory?.reorderThreshold || 10,
        inventoryStatus: inventory?.inventoryStatus || 'IN_STOCK'
      },
      search: {
        autocompleteTerms: [core.name, slug, brand?.name || 'GENERIC'],
        searchableKeywords: keywords,
        popularityScore: 0
      },
      compliance: {
        isHazardous: compliance?.isHazardous || false,
        restrictions: compliance?.restrictions || []
      }
    };

    return productRepository.create(productPayload);
  }

  /**
   * Retrieve a single product by its custom unique ID
   */
  async getProductById(productId) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new ApiError(404, `Product with ID "${productId}" could not be found.`, 'PRODUCT_NOT_FOUND');
    }
    return product;
  }

  /**
   * Retrieve a single product by its SEO slug
   */
  async getProductBySlug(slug) {
    const product = await productRepository.findBySlug(slug);
    if (!product) {
      throw new ApiError(404, `Product with slug "${slug}" could not be found.`, 'PRODUCT_NOT_FOUND');
    }
    return product;
  }

  /**
   * Run advanced catalog queries with sorting, pagination, and multi-filters
   */
  async queryCatalog(queryParams) {
    const { page, limit, sortField, sortOrder, minPrice, maxPrice, categoryId, brandId, isPremium, search } = queryParams;

    const filters = {
      categoryId,
      brandId,
      isPremium,
      minPrice,
      maxPrice,
      search
    };

    // If categoryId is defined but categoryPath is not, resolve path first to match subcategories recursively
    if (categoryId) {
      const cat = await categoryRepository.findById(categoryId);
      if (cat) {
        filters.categoryPath = cat.path;
      }
    }

    const pagination = { page, limit };
    const sort = { field: sortField, order: sortOrder };

    return productRepository.queryCatalog(filters, pagination, sort);
  }

  /**
   * Update catalog profile of a product
   */
  async updateProduct(productId, updateData) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new ApiError(404, `Product with ID "${productId}" does not exist.`, 'PRODUCT_NOT_FOUND');
    }

    // Force pre-save hook dynamic price recalculation by saving over the model
    Object.keys(updateData).forEach((key) => {
      // Direct deep merge for nested models
      if (typeof updateData[key] === 'object' && updateData[key] !== null && product[key]) {
        Object.assign(product[key], updateData[key]);
      } else {
        product[key] = updateData[key];
      }
    });

    return product.save();
  }

  /**
   * Soft delete a product from the ACTIVE catalog
   */
  async deleteProduct(productId) {
    const product = await productRepository.softDelete(productId);
    if (!product) {
      throw new ApiError(404, `Product with ID "${productId}" does not exist.`, 'PRODUCT_NOT_FOUND');
    }
    return true;
  }

  /**
   * Helper: Slugify names
   * @private
   */
  _slugify(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-');
  }

  /**
   * Helper: Extract keyword tokens for search indexing
   * @private
   */
  _extractKeywords(name, desc, path) {
    const cleanSource = `${name} ${desc} ${path.join(' ')}`
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ');

    const words = cleanSource.split(/\s+/).filter(w => w.length > 2);
    return [...new Set(words)]; // Deduplicate keywords
  }
}

export default new ProductService();
export { ProductService };

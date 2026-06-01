import Product from '../../infrastructure/database/models/product.model.js';

/**
 * ProductRepository encapsulates all data access commands, query compilation, 
 * and critical atomic inventory transactions for the catalog.
 */
class ProductRepository {
  /**
   * Find product by its custom domain identity productId
   */
  async findById(productId) {
    return Product.findOne({ 'identity.productId': productId }).exec();
  }

  /**
   * Find product by unique warehouse identifier SKU
   */
  async findBySku(sku) {
    return Product.findOne({ 'identity.sku': sku }).exec();
  }

  /**
   * Find product by unique SEO-friendly slug
   */
  async findBySlug(slug) {
    return Product.findOne({ 'identity.slug': slug.toLowerCase() }).exec();
  }

  /**
   * Create a new product entry
   */
  async create(productData) {
    const product = new Product(productData);
    return product.save();
  }

  /**
   * Update an existing product
   */
  async update(productId, updateData) {
    return Product.findOneAndUpdate(
      { 'identity.productId': productId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Soft delete a product
   */
  async softDelete(productId) {
    return Product.findOneAndUpdate(
      { 'identity.productId': productId },
      { 
        $set: { 
          'system.isDeleted': true,
          'system.deletedAt': new Date() 
        } 
      },
      { new: true }
    ).exec();
  }

  /**
   * ATOMIC INVENTORY RESERVATION ENGINE
   * Atomically books stock from available pool to reserved pool.
   * Mitigates race conditions and prevents over-selling.
   * @param {string} productId - Target product unique domain ID
   * @param {number} quantity - Quantity of items to reserve
   */
  async reserveStock(productId, quantity) {
    if (quantity <= 0) return null;

    return Product.findOneAndUpdate(
      {
        'identity.productId': productId,
        'inventory.availableStock': { $gte: quantity }, // Check stock exists atomically
        'system.isDeleted': false
      },
      {
        $inc: {
          'inventory.availableStock': -quantity,
          'inventory.reservedStock': quantity
        }
      },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * ATOMIC INVENTORY TRANSACTION CONFIRMATION
   * Executes upon checkout payment completion. Shifts reserved stock to sold status.
   * @param {string} productId - Target product unique domain ID
   * @param {number} quantity - Quantity of items to confirm
   */
  async confirmStockSale(productId, quantity) {
    if (quantity <= 0) return null;

    return Product.findOneAndUpdate(
      {
        'identity.productId': productId,
        'inventory.reservedStock': { $gte: quantity } // Ensure we have enough reserved to capture
      },
      {
        $inc: {
          'inventory.reservedStock': -quantity,
          'inventory.soldStock': quantity
        }
      },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * ATOMIC RESERVATION RELEASE ENGINE
   * Executes upon checkout abandonment/failures. Shifts reserved stock back to available pool.
   * @param {string} productId - Target product unique domain ID
   * @param {number} quantity - Quantity of items to release
   */
  async releaseStock(productId, quantity) {
    if (quantity <= 0) return null;

    return Product.findOneAndUpdate(
      {
        'identity.productId': productId,
        'inventory.reservedStock': { $gte: quantity }
      },
      {
        $inc: {
          'inventory.availableStock': quantity,
          'inventory.reservedStock': -quantity
        }
      },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Dynamic Query Engine: Filter, Paginate, and Sort catalog entries.
   * Optimized compound index utilization for high scalability.
   */
  async queryCatalog(filters = {}, pagination = {}, sort = {}) {
    const query = { 'system.isDeleted': false };

    // A. Dynamic Filters
    if (filters.categoryId) {
      query['category.categoryId'] = filters.categoryId;
    }

    if (filters.categoryPath && filters.categoryPath.length > 0) {
      // Matches any leaf nodes or sub-nodes nested in the provided taxonomy path
      filters.categoryPath.forEach((node, index) => {
        query[`category.path.${index}`] = node;
      });
    }

    if (filters.brandId) {
      query['brand.brandId'] = filters.brandId;
    }

    if (filters.isPremium !== undefined) {
      query['brand.isPremium'] = filters.isPremium === 'true';
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query['pricing.finalPrice'] = {};
      if (filters.minPrice !== undefined) {
        query['pricing.finalPrice'].$gte = parseFloat(filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query['pricing.finalPrice'].$lte = parseFloat(filters.maxPrice);
      }
    }

    if (filters.search) {
      // Fuzzy prefix keyword search via compiled searchable tags & normalized strings
      const searchTerms = filters.search.toLowerCase().trim().split(/\s+/);
      query['search.searchableKeywords'] = { $all: searchTerms };
    }

    // B. Pagination Values
    const page = Math.max(1, parseInt(pagination.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(pagination.limit, 10) || 10));
    const skip = (page - 1) * limit;

    // C. Sorting Blueprint
    let sortBlueprint = {};
    if (sort.field) {
      const order = sort.order === 'desc' ? -1 : 1;
      if (sort.field === 'price') {
        sortBlueprint['pricing.finalPrice'] = order;
      } else if (sort.field === 'popularity') {
        sortBlueprint['search.popularityScore'] = order;
      } else {
        sortBlueprint.createdAt = -1;
      }
    } else {
      // Default fallback
      sortBlueprint['search.popularityScore'] = -1;
    }

    // D. Execution
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sortBlueprint)
        .skip(skip)
        .limit(limit)
        .exec(),
      Product.countDocuments(query).exec()
    ]);

    const pages = Math.ceil(total / limit);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    };
  }
}

export default new ProductRepository();
export { ProductRepository };

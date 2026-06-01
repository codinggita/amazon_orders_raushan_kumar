import Category from '../../infrastructure/database/models/category.model.js';

/**
 * CategoryRepository encapsulates database queries and transactions 
 * for Category documents, providing optimized taxonomy queries.
 */
class CategoryRepository {
  /**
   * Resolve a category using its unique identifier
   */
  async findById(categoryId) {
    return Category.findOne({ categoryId }).exec();
  }

  /**
   * Resolve a category by its unique SEO slug
   */
  async findBySlug(slug) {
    return Category.findOne({ slug: slug.toLowerCase() }).exec();
  }

  /**
   * Retrieve all categories that are currently active
   */
  async findAllActive() {
    return Category.find({ isActive: true }).sort({ name: 1 }).exec();
  }

  /**
   * Create a new category node
   */
  async create(categoryData) {
    const category = new Category(categoryData);
    return category.save();
  }

  /**
   * Update category node attributes
   */
  async update(categoryId, updateData) {
    return Category.findOneAndUpdate(
      { categoryId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Soft-deactivate a category node (sets isActive: false)
   */
  async deactivate(categoryId) {
    return Category.findOneAndUpdate(
      { categoryId },
      { $set: { isActive: false } },
      { new: true }
    ).exec();
  }

  /**
   * Hard delete a category node
   */
  async delete(categoryId) {
    return Category.findOneAndDelete({ categoryId }).exec();
  }

  /**
   * Resolve all subcategories nested below a specific parent category path.
   * Leverages prefix index matching on path array index positions.
   * @param {string[]} parentPath - e.g. ["Electronics", "Audio"]
   */
  async findSubcategoriesByPath(parentPath) {
    if (!Array.isArray(parentPath) || parentPath.length === 0) {
      return [];
    }

    const query = { isActive: true };
    // Forces exact prefix index matching: path[0] == parentPath[0], path[1] == parentPath[1], etc.
    parentPath.forEach((node, index) => {
      query[`path.${index}`] = node;
    });

    return Category.find(query).sort({ 'path.length': 1, name: 1 }).exec();
  }
}

export default new CategoryRepository();
export { CategoryRepository };

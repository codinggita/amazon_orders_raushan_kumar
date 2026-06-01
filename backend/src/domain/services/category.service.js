import crypto from 'crypto';
import categoryRepository from '../repositories/category.repository.js';
import ApiError from '../../utils/apiError.js';

/**
 * CategoryService handles business rules around category tree assembly,
 * automatic materialized path compilation, slugification, and unique node assertions.
 */
class CategoryService {
  /**
   * Add a new category node to the taxonomy structure
   * @param {Object} input - Category details
   */
  async createCategory(input) {
    const { name, hierarchy, searchableTags, recommendationGroups } = input;

    if (!name || !hierarchy || !hierarchy.main) {
      throw new ApiError(400, 'Category name and at least the main division hierarchy parameter are required.', 'VALIDATION_FAILED');
    }

    // Check for name uniqueness
    const existing = await categoryRepository.findBySlug(this._slugify(name));
    if (existing) {
      throw new ApiError(400, `A category named "${name}" already exists in the system.`, 'CATEGORY_ALREADY_EXISTS');
    }

    const categoryId = `cat_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;
    const slug = this._slugify(name);

    // AUTOMATIC HIERARCHICAL PATH ARRAYS ASSEMBLY
    // e.g. main: "Electronics", sub: "Audio", leaf: "Earbuds" -> path: ["Electronics", "Audio", "Earbuds"]
    const path = [hierarchy.main];
    if (hierarchy.sub) {
      path.push(hierarchy.sub);
      if (hierarchy.leaf) {
        path.push(hierarchy.leaf);
      }
    }

    return categoryRepository.create({
      categoryId,
      name,
      slug,
      hierarchy,
      path,
      searchableTags: searchableTags || [],
      recommendationGroups: recommendationGroups || [],
      isActive: true
    });
  }

  /**
   * Retrieve all categories as a flat sorted list
   */
  async getActiveCategories() {
    return categoryRepository.findAllActive();
  }

  /**
   * Retrieve subcategories nested beneath a specific path
   * @param {string[]} pathArray - Path array segment (e.g. ["Electronics", "Audio"])
   */
  async getSubcategories(pathArray) {
    if (!Array.isArray(pathArray) || pathArray.length === 0) {
      throw new ApiError(400, 'Subcategory lookups require a valid string array path filter.', 'VALIDATION_FAILED');
    }
    return categoryRepository.findSubcategoriesByPath(pathArray);
  }

  /**
   * Retrieve category details by unique ID
   */
  async getCategoryById(categoryId) {
    const category = await categoryRepository.findById(categoryId);
    if (!category) {
      throw new ApiError(404, `Category ID "${categoryId}" could not be resolved.`, 'CATEGORY_NOT_FOUND');
    }
    return category;
  }

  /**
   * Update category properties
   */
  async updateCategory(categoryId, updateData) {
    const category = await categoryRepository.findById(categoryId);
    if (!category) {
      throw new ApiError(404, `Category ID "${categoryId}" could not be resolved.`, 'CATEGORY_NOT_FOUND');
    }

    if (updateData.name) {
      updateData.slug = this._slugify(updateData.name);
    }

    if (updateData.hierarchy) {
      const hierarchy = { ...category.hierarchy.toObject(), ...updateData.hierarchy };
      const path = [hierarchy.main];
      if (hierarchy.sub) {
        path.push(hierarchy.sub);
        if (hierarchy.leaf) {
          path.push(hierarchy.leaf);
        }
      }
      updateData.path = path;
      updateData.hierarchy = hierarchy;
    }

    return categoryRepository.update(categoryId, updateData);
  }

  /**
   * Delete category node completely
   */
  async deleteCategory(categoryId) {
    const deleted = await categoryRepository.delete(categoryId);
    if (!deleted) {
      throw new ApiError(404, `Category ID "${categoryId}" could not be resolved.`, 'CATEGORY_NOT_FOUND');
    }
    return true;
  }

  /**
   * Helper: Slugify category name
   * @private
   */
  _slugify(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // remove spec chars
      .replace(/[\s_]+/g, '-') // spaces and underscores to dashes
      .replace(/-+/g, '-'); // collapse multiple dashes
  }
}

export default new CategoryService();
export { CategoryService };

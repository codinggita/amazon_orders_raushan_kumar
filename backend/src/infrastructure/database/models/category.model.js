import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required.'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    hierarchy: {
      main: {
        type: String,
        required: [true, 'Main category division is required.'],
        index: true,
      },
      sub: {
        type: String,
        trim: true,
      },
      leaf: {
        type: String,
        trim: true,
      },
    },
    path: {
      type: [String], // e.g. ["Electronics", "Audio", "Earbuds"]
      required: true,
      index: true, // Crucial for recursive taxonomy queries (e.g. products under "Electronics")
    },
    searchableTags: {
      type: [String],
      default: [],
      index: true,
    },
    recommendationGroups: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// COMPOUND INDEXES FOR ANCHORED TAXONOMY FILTERS
// Speeds up searches for active categories within specific sub-branches
categorySchema.index({ isActive: 1, path: 1 });
categorySchema.index({ 'hierarchy.main': 1, 'hierarchy.sub': 1 });

const Category = mongoose.model('Category', categorySchema);

export default Category;
export { Category };

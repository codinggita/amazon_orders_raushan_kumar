import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    // 1. PRODUCT IDENTITY SYSTEM
    identity: {
      productId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
      },
      sku: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
      },
      slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
      },
      barcode: {
        type: String,
        trim: true,
        index: true,
      },
      globalTradeItemNumber: {
        type: String,
        trim: true,
      },
    },

    // 2. PRODUCT CORE SYSTEM
    core: {
      name: {
        type: String,
        required: [true, 'Product name is required.'],
        trim: true,
      },
      shortDescription: {
        type: String,
        required: [true, 'Short description is required.'],
        trim: true,
      },
      fullDescription: {
        type: String,
        trim: true,
      },
      technicalSpecifications: {
        type: Map,
        of: String,
        default: {},
      },
      dimensions: {
        width: { type: Number, default: 0 },
        height: { type: Number, default: 0 },
        depth: { type: Number, default: 0 },
        unit: { type: String, default: 'cm' },
      },
      material: {
        type: String,
        trim: true,
      },
      weight: {
        value: { type: Number, default: 0 },
        unit: { type: String, default: 'kg' },
      },
      images: {
        type: [String],
        default: [],
      },
      variants: [
        {
          variantId: { type: String, required: true },
          sku: { type: String, required: true },
          options: { type: Map, of: String }, // e.g. Color: Red, Size: XL
          priceAdjustment: { type: Number, default: 0 },
          availableStock: { type: Number, default: 0 },
        },
      ],
    },

    // 3. TAXONOMY SYSTEM
    category: {
      categoryId: {
        type: String,
        required: true,
        index: true,
      },
      hierarchy: {
        main: { type: String, required: true },
        sub: { type: String },
        leaf: { type: String },
      },
      path: {
        type: [String], // e.g. ["Electronics", "Audio", "Earbuds"]
        required: true,
        index: true, // Enables high-speed recursive subpath query mappings
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
    },

    // 4. BRAND SYSTEM
    brand: {
      brandId: {
        type: String,
        required: true,
        index: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },
      country: {
        type: String,
        trim: true,
      },
      isPremium: {
        type: Boolean,
        default: false,
        index: true,
      },
      officialStore: {
        type: Boolean,
        default: false,
      },
      trustScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 100,
      },
    },

    // 5. PRICING ENGINE SYSTEM
    pricing: {
      basePrice: {
        type: Number,
        required: [true, 'Base price is required.'],
        min: [0, 'Base price cannot be negative.'],
      },
      currency: {
        type: String,
        required: true,
        uppercase: true,
        default: 'USD',
      },
      discount: {
        type: {
          type: String,
          enum: ['PERCENTAGE', 'FLAT'],
          default: 'PERCENTAGE',
        },
        value: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
      tax: {
        rate: {
          type: Number,
          default: 0, // In percentage e.g. 18 for 18% GST
          min: 0,
        },
      },
      shippingCost: {
        type: Number,
        default: 0,
        min: 0,
      },
      finalPrice: {
        type: Number,
        required: true,
        min: 0,
        index: true,
      },
      pricingHistory: [
        {
          price: { type: Number, required: true },
          effectiveFrom: { type: Date, default: Date.now },
          effectiveTo: { type: Date },
        },
      ],
    },

    // 6. INVENTORY SYSTEM
    inventory: {
      availableStock: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      reservedStock: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      soldStock: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      damagedStock: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      warehouses: [
        {
          warehouseId: { type: String, required: true },
          stock: { type: Number, default: 0 },
        },
      ],
      reorderThreshold: {
        type: Number,
        required: true,
        default: 10,
      },
      inventoryStatus: {
        type: String,
        enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'PREORDER'],
        default: 'OUT_OF_STOCK',
        index: true,
      },
    },

    // 7. SEARCH SYSTEM (Typo tolerance prep)
    search: {
      normalizedName: {
        type: String,
        trim: true,
        lowercase: true,
        index: true,
      },
      autocompleteTerms: {
        type: [String],
        default: [],
      },
      searchableKeywords: {
        type: [String],
        default: [],
        index: true,
      },
      synonyms: {
        type: [String],
        default: [],
      },
      popularityScore: {
        type: Number,
        default: 0,
        index: true,
      },
    },

    // 8. RECOMMENDATION METADATA SYSTEM
    recommendationMetadata: {
      frequentlyBoughtTogether: {
        type: [String], // productId references
        default: [],
      },
      viewedTogether: {
        type: [String],
        default: [],
      },
      similarProducts: {
        type: [String],
        default: [],
      },
      trendingScore: {
        type: Number,
        default: 0,
        index: true,
      },
      categoryAffinity: {
        type: Number,
        default: 0,
      },
    },

    // 9. ANALYTICS ENGINE DATA
    analytics: {
      totalViews: { type: Number, default: 0 },
      totalPurchases: { type: Number, default: 0 },
      returnRate: { type: Number, default: 0 },
    },

    // 10. COMPLIANCE & SYSTEM FIELDS
    compliance: {
      isHazardous: { type: Boolean, default: false },
      restrictions: { type: [String], default: [] },
    },
    system: {
      isDeleted: {
        type: Boolean,
        required: true,
        default: false,
        index: true,
      },
      deletedAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// COMPOUND INDEXES FOR ADVANCED QUERY PATTERNS
// Optimization for catalog listing: Filter by category path + active availability + sorting by popularity
productSchema.index({ 'system.isDeleted': 1, 'category.path': 1, 'inventory.inventoryStatus': 1, 'search.popularityScore': -1 });

// Optimization for product search with price-range filtering
productSchema.index({ 'system.isDeleted': 1, 'search.searchableKeywords': 1, 'pricing.finalPrice': 1 });

// PRE-VALIDATE HOOK: Dynamic Pricing Engine + Inventory status mapping
productSchema.pre('validate', function (next) {
  const product = this;

  // A. CALCULATE FINAL PRICE
  let calculatedPrice = product.pricing.basePrice;
  const discount = product.pricing.discount;

  if (discount && discount.value > 0) {
    if (discount.type === 'PERCENTAGE') {
      calculatedPrice -= (calculatedPrice * (discount.value / 100));
    } else if (discount.type === 'FLAT') {
      calculatedPrice -= discount.value;
    }
  }

  // Calculate Tax (e.g., 18 for 18% tax)
  const tax = product.pricing.tax;
  if (tax && tax.rate > 0) {
    calculatedPrice += (calculatedPrice * (tax.rate / 100));
  }

  // Include Shipping Costs
  calculatedPrice += (product.pricing.shippingCost || 0);

  // Set final price locked, rounding to maximum 2 decimals
  const finalCalculated = Math.max(0, parseFloat(calculatedPrice.toFixed(2)));
  
  // Track pricing history snapshot on shifts
  if (product.isModified('pricing.basePrice') || product.isModified('pricing.discount') || product.isNew) {
    product.pricing.pricingHistory.push({
      price: finalCalculated,
      effectiveFrom: new Date(),
    });
  }

  product.pricing.finalPrice = finalCalculated;

  // B. INVENTORY STATUS CORRELATION
  const availableStock = product.inventory.availableStock;
  if (product.inventory.inventoryStatus !== 'PREORDER') {
    if (availableStock <= 0) {
      product.inventory.inventoryStatus = 'OUT_OF_STOCK';
    } else if (availableStock <= product.inventory.reorderThreshold) {
      product.inventory.inventoryStatus = 'LOW_STOCK';
    } else {
      product.inventory.inventoryStatus = 'IN_STOCK';
    }
  }

  // C. AUTO-NORMALIZATION FOR TEXT MATCHINGS
  if (product.isModified('core.name') || product.isNew) {
    product.search.normalizedName = product.core.name.toLowerCase().trim();
  }

  next();
});

// QUERY MIDDLEWARE: Filter out soft-deleted entries automatically
productSchema.pre(/^find/, function (next) {
  this.where({ 'system.isDeleted': false });
  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;

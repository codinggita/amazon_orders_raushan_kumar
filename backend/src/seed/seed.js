import mongoose from 'mongoose';
import crypto from 'crypto';
import env from '../configs/env.config.js';
import User from '../infrastructure/database/models/user.model.js';
import Category from '../infrastructure/database/models/category.model.js';
import Product from '../infrastructure/database/models/product.model.js';
import Order from '../infrastructure/database/models/order.model.js';
import logger from '../infrastructure/logger/index.js';

const seedData = async () => {
  try {
    logger.info('Starting database seeding procedure...');
    
    // Connect to database if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.mongodbUri);
      logger.info('Connected to MongoDB database pool for seeding.');
    }

    // 1. CLEAR COLLECTIONS TO PREVENT DUPLICATIONS
    logger.info('Wiping existing database collections...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({})
    ]);

    // 2. SEED SECURITY ACCOUNTS
    logger.info('Seeding IAM security user accounts...');
    
    // Admin profile (carries VIEW_ANALYTICS and MANAGE_INVENTORY)
    const adminUser = await User.create({
      userId: `usr_adm${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`,
      email: 'admin@commerce.com',
      password: 'AdminPass9988!', // Will be auto-hashed by Mongoose pre-save hook
      firstName: 'Albus',
      lastName: 'Dumbledore',
      role: 'ADMIN',
      permissions: ['VIEW_ANALYTICS', 'MANAGE_INVENTORY', 'VIEW_PRODUCTS'],
      accountStatus: 'ACTIVE'
    });

    // Customer profile (basic shopper permissions)
    const customerUser = await User.create({
      userId: `usr_cus${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`,
      email: 'customer@gmail.com',
      password: 'CustomerPass9988!',
      firstName: 'Harry',
      lastName: 'Potter',
      role: 'CUSTOMER',
      permissions: ['CREATE_ORDER', 'VIEW_PRODUCTS'],
      accountStatus: 'ACTIVE'
    });

    logger.info('User accounts successfully seeded.');

    // 3. SEED TAXONOMY SYSTEM HIERARCHY
    logger.info('Seeding hierarchical taxonomy divisions...');
    
    const catEarbuds = await Category.create({
      categoryId: 'cat_earbuds99',
      name: 'Wireless Earbuds',
      slug: 'wireless-earbuds',
      hierarchy: {
        main: 'Electronics',
        sub: 'Audio',
        leaf: 'Earbuds'
      },
      path: ['Electronics', 'Audio', 'Earbuds'],
      searchableTags: ['audio', 'wireless', 'earphones', 'bluetooth'],
      recommendationGroups: ['Electronics-Audio']
    });

    const catLaptops = await Category.create({
      categoryId: 'cat_laptops88',
      name: 'Pro Laptops',
      slug: 'pro-laptops',
      hierarchy: {
        main: 'Electronics',
        sub: 'Computers',
        leaf: 'Laptops'
      },
      path: ['Electronics', 'Computers', 'Laptops'],
      searchableTags: ['computer', 'laptop', 'developer', 'hardware'],
      recommendationGroups: ['Electronics-Computers']
    });

    logger.info('Category taxonomy seeded successfully.');

    // 4. SEED PRODUCT CATALOG ITEMS
    logger.info('Seeding product catalog listings...');
    
    const productEarbuds = await Product.create({
      identity: {
        productId: 'prod_earbuds123',
        sku: 'SKU-APX-998877',
        slug: 'apex-wireless-earbuds',
        barcode: '123456789012',
        globalTradeItemNumber: '01234567890123'
      },
      core: {
        name: 'Apex Wireless Earbuds',
        shortDescription: 'High fidelity ANC bluetooth earphones with deep bass response.',
        fullDescription: 'Experience pure audio clarity with active noise cancellation and a 40-hour battery life.',
        technicalSpecifications: {
          Bluetooth: 'v5.3',
          Waterproof: 'IPX7',
          ANC: 'Up to 45dB'
        },
        dimensions: { width: 6, height: 4, depth: 3, unit: 'cm' },
        weight: { value: 0.05, unit: 'kg' }
      },
      category: {
        categoryId: catEarbuds.categoryId,
        hierarchy: catEarbuds.hierarchy,
        path: catEarbuds.path,
        searchableTags: catEarbuds.searchableTags,
        recommendationGroups: catEarbuds.recommendationGroups
      },
      brand: {
        brandId: 'brd_apex',
        name: 'Apex Audio',
        country: 'Germany',
        isPremium: true,
        trustScore: 98
      },
      pricing: {
        basePrice: 100.00,
        currency: 'USD',
        discount: { type: 'PERCENTAGE', value: 10 }, // 10% discount -> $90
        tax: { rate: 10 }, // 10% tax on $90 -> $99
        shippingCost: 5 // shipping -> $104 final price
      },
      inventory: {
        availableStock: 100,
        reorderThreshold: 10,
        inventoryStatus: 'IN_STOCK'
      },
      search: {
        autocompleteTerms: ['Apex Wireless Earbuds', 'apex-wireless-earbuds', 'Apex Audio'],
        searchableKeywords: ['apex', 'wireless', 'earbuds', 'anc', 'audio', 'electronics'],
        popularityScore: 85
      }
    });

    const productLaptop = await Product.create({
      identity: {
        productId: 'prod_laptop456',
        sku: 'SKU-APX-887766',
        slug: 'apex-pro-laptop-16',
        barcode: '987654321098'
      },
      core: {
        name: 'Apex Pro Laptop 16',
        shortDescription: 'Ultimate developer workstation featuring a 16-core CPU and 64GB RAM.',
        fullDescription: 'High performance computer built for massive programming compile cycles and virtualization.',
        technicalSpecifications: {
          CPU: '16-Core',
          RAM: '64GB DDR5',
          Storage: '2TB NVMe SSD'
        },
        dimensions: { width: 35, height: 24, depth: 1.8, unit: 'cm' },
        weight: { value: 2.1, unit: 'kg' }
      },
      category: {
        categoryId: catLaptops.categoryId,
        hierarchy: catLaptops.hierarchy,
        path: catLaptops.path,
        searchableTags: catLaptops.searchableTags,
        recommendationGroups: catLaptops.recommendationGroups
      },
      brand: {
        brandId: 'brd_apex',
        name: 'Apex Computers',
        country: 'USA',
        isPremium: true,
        trustScore: 99
      },
      pricing: {
        basePrice: 1500.00,
        currency: 'USD',
        discount: { type: 'FLAT', value: 100 }, // $1400
        tax: { rate: 5 }, // 5% tax -> $1470
        shippingCost: 30 // shipping -> $1500 final price
      },
      inventory: {
        availableStock: 25,
        reorderThreshold: 5,
        inventoryStatus: 'IN_STOCK'
      },
      search: {
        autocompleteTerms: ['Apex Pro Laptop 16', 'apex-pro-laptop-16', 'Apex Computers'],
        searchableKeywords: ['apex', 'pro', 'laptop', 'developer', 'workstation', 'hardware', 'electronics'],
        popularityScore: 92
      }
    });

    logger.info('Catalog products successfully seeded.');

    // 5. SEED IMMUTABLE ORDER LIFE HISTORY
    logger.info('Seeding sample commerce completed orders...');
    
    await Order.create({
      orderId: 'ord_sample_9988',
      customerSnapshot: {
        userId: customerUser.userId,
        email: customerUser.email,
        firstName: customerUser.firstName,
        lastName: customerUser.lastName,
        phone: '1-800-555-0199'
      },
      products: [
        {
          productSnapshot: {
            productId: productEarbuds.identity.productId,
            sku: productEarbuds.identity.sku,
            name: productEarbuds.core.name,
            shortDescription: productEarbuds.core.shortDescription,
            categoryPath: productEarbuds.category.path,
            brandName: productEarbuds.brand.name
          },
          pricingSnapshot: {
            basePrice: productEarbuds.pricing.basePrice,
            discountType: productEarbuds.pricing.discount.type,
            discountValue: productEarbuds.pricing.discount.value,
            taxRate: productEarbuds.pricing.tax.rate,
            shippingCost: productEarbuds.pricing.shippingCost,
            finalPricePerUnit: productEarbuds.pricing.finalPrice
          },
          quantity: 2 // final price = 104 * 2 = 208
        }
      ],
      paymentSnapshot: {
        paymentId: 'pay_sample_9988',
        method: 'CREDIT_CARD',
        status: 'COMPLETED',
        amount: 208.00,
        transactionId: 'txn_stripe_554433',
        paidAt: new Date(Date.now() - 86400000) // Paid 1 day ago
      },
      shippingSnapshot: {
        carrier: 'FEDEX',
        trackingNumber: 'TRK9988776655',
        address: {
          street: '4 Privet Drive',
          city: 'Little Whinging',
          state: 'Surrey',
          zip: 'WD25 7FD',
          country: 'United Kingdom'
        }
      },
      status: 'DELIVERED',
      fulfillment: {
        status: 'FULFILLED',
        dispatchedAt: new Date(Date.now() - 43200000),
        deliveredAt: new Date()
      },
      analyticsSnapshot: {
        subtotalAmount: 200.00,
        discountAmount: 20.00,
        taxAmount: 18.00,
        shippingAmount: 10.00,
        totalRevenue: 208.00
      },
      auditTrail: [
        { status: 'PENDING', changedAt: new Date(Date.now() - 90000000), changedBy: customerUser.userId, note: 'Order initialized.' },
        { status: 'CONFIRMED', changedAt: new Date(Date.now() - 86400000), changedBy: 'SYSTEM', note: 'Status transitioned from PENDING to CONFIRMED. Payment verified.' },
        { status: 'SHIPPED', changedAt: new Date(Date.now() - 43200000), changedBy: 'SYSTEM', note: 'Status transitioned from CONFIRMED to SHIPPED. Dispatched via FEDEX.' },
        { status: 'DELIVERED', changedAt: new Date(), changedBy: 'SYSTEM', note: 'Status transitioned from SHIPPED to DELIVERED. Package received.' }
      ]
    });

    logger.info('Database seeder procedure completed successfully.');

  } catch (error) {
    logger.error('CRITICAL: Seeding procedure encountered a fatal exception!', error);
  } finally {
    // Only close connection if we ran this standalone in execution scripts
    if (process.argv[1]?.endsWith('seed.js')) {
      await mongoose.connection.close();
      logger.info('Database connection pool cleanly closed.');
    }
  }
};

// Autostart seeding if executing directly via CLI command
if (process.argv[1]?.endsWith('seed.js')) {
  seedData();
}

export default seedData;
export { seedData };

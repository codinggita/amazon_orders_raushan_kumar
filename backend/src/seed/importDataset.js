import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import env from '../configs/env.config.js';
import User from '../infrastructure/database/models/user.model.js';
import Category from '../infrastructure/database/models/category.model.js';
import Product from '../infrastructure/database/models/product.model.js';
import Order from '../infrastructure/database/models/order.model.js';
import logger from '../infrastructure/logger/index.js';

// Helper to normalize strings for ID and Slug mapping
const slugify = (text) => {
  if (!text) return 'generic';
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const importDataset = async () => {
  const filePath = 'c:\\Users\\Raushan\\Downloads\\Amazon_Orders.json';
  
  try {
    logger.info(`Starting high-performance dataset import from: ${filePath}`);
    
    // Connect to database if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.mongodbUri);
      logger.info('Connected to MongoDB Atlas database pool.');
    }

    // 1. Wipe existing database collections
    logger.info('Wiping existing database collections for a clean import...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({})
    ]);
    logger.info('Database collections cleared successfully.');

    // 2. Read dataset file
    logger.info('Reading Amazon_Orders.json dataset file...');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const records = JSON.parse(rawData);
    logger.info(`Dataset loaded successfully. Total records found: ${records.length}`);

    // 3. Extract unique collections to optimize DB writes and prevent duplicate processing
    logger.info('Analyzing dataset to extract unique Entities...');
    
    const uniqueCustomers = new Map();
    const uniqueSellers = new Map();
    const uniqueCategories = new Set();
    const uniqueBrands = new Set();
    const uniqueProducts = new Map();

    for (const record of records) {
      // Collect Category
      uniqueCategories.add(record.Category);

      // Collect Brand
      uniqueBrands.add(record.Brand);

      // Collect Customer
      if (!uniqueCustomers.has(record.CustomerID)) {
        uniqueCustomers.set(record.CustomerID, {
          userId: record.CustomerID,
          email: `${slugify(record.CustomerName)}.${record.CustomerID.toLowerCase()}@gmail.com`,
          firstName: record.CustomerName.split(' ')[0] || 'Buyer',
          lastName: record.CustomerName.split(' ').slice(1).join(' ') || 'User',
          role: 'CUSTOMER'
        });
      }

      // Collect Seller
      if (!uniqueSellers.has(record.SellerID)) {
        uniqueSellers.set(record.SellerID, {
          userId: record.SellerID,
          email: `${record.SellerID.toLowerCase()}@seller.com`,
          firstName: 'Merchant',
          lastName: record.SellerID,
          role: 'SELLER'
        });
      }

      // Collect Product
      if (!uniqueProducts.has(record.ProductID)) {
        uniqueProducts.set(record.ProductID, {
          productId: record.ProductID,
          name: record.ProductName,
          category: record.Category,
          brand: record.Brand,
          unitPrice: parseFloat(record.UnitPrice) || 10.00
        });
      }
    }

    logger.info(`Extracted: ${uniqueCategories.size} Categories, ${uniqueBrands.size} Brands, ${uniqueCustomers.size} Customers, ${uniqueSellers.size} Sellers, ${uniqueProducts.size} Products.`);

    // 4. Create Category Hierarchy Documents
    logger.info('Inserting Category Taxonomy documents...');
    const categoriesMap = new Map();
    for (const catName of uniqueCategories) {
      const catId = `cat_${slugify(catName)}`;
      const catDoc = await Category.create({
        categoryId: catId,
        name: catName,
        slug: slugify(catName),
        hierarchy: { main: catName },
        path: [catName],
        searchableTags: [slugify(catName)],
        recommendationGroups: [`Group-${slugify(catName)}`]
      });
      categoriesMap.set(catName, catDoc);
    }
    logger.info('Categories successfully created.');

    // 5. Create Admin, Customer, and Seller Users
    logger.info('Creating security accounts and hashing passwords (in batches)...');
    
    // Always include a default system admin account
    const defaultPassword = 'SecurityPassword99!';
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    const adminUser = await User.create({
      userId: 'usr_adm_default',
      email: 'admin@commerce.com',
      password: defaultPassword, // Auto-hashed by user pre-save hook
      firstName: 'Albus',
      lastName: 'Dumbledore',
      role: 'ADMIN',
      permissions: ['VIEW_ANALYTICS', 'MANAGE_INVENTORY', 'VIEW_PRODUCTS'],
      accountStatus: 'ACTIVE'
    });

    // Bulk write users directly to optimize speed (bypassing pre-save hooks for speed, using prehashed password)
    const userDocs = [];
    
    for (const cust of uniqueCustomers.values()) {
      userDocs.push({
        userId: cust.userId,
        email: cust.email,
        password: passwordHash,
        firstName: cust.firstName,
        lastName: cust.lastName,
        role: cust.role,
        permissions: ['CREATE_ORDER', 'VIEW_PRODUCTS'],
        accountStatus: 'ACTIVE'
      });
    }

    for (const sel of uniqueSellers.values()) {
      userDocs.push({
        userId: sel.userId,
        email: sel.email,
        password: passwordHash,
        firstName: sel.firstName,
        lastName: sel.lastName,
        role: sel.role,
        permissions: ['VIEW_PRODUCTS'],
        accountStatus: 'ACTIVE'
      });
    }

    // Insert Users in batches of 1000
    const userBatchSize = 1000;
    for (let i = 0; i < userDocs.length; i += userBatchSize) {
      const batch = userDocs.slice(i, i + userBatchSize);
      await User.insertMany(batch, { ordered: false });
      logger.info(`Users batch inserted: ${Math.min(i + userBatchSize, userDocs.length)} / ${userDocs.length}`);
    }
    logger.info('All Customers and Sellers successfully created.');

    // 6. Create Products Catalog
    logger.info('Inserting Products Catalog listings...');
    const productDocs = [];
    
    for (const prod of uniqueProducts.values()) {
      const catDoc = categoriesMap.get(prod.category);
      productDocs.push({
        identity: {
          productId: prod.productId,
          sku: `SKU-${prod.productId}`,
          slug: slugify(prod.name)
        },
        core: {
          name: prod.name,
          shortDescription: `Premium high quality ${prod.name}.`,
          fullDescription: `The authentic top-tier ${prod.name} optimized for commerce intelligence.`
        },
        category: {
          categoryId: catDoc.categoryId,
          hierarchy: catDoc.hierarchy,
          path: catDoc.path,
          searchableTags: catDoc.searchableTags,
          recommendationGroups: catDoc.recommendationGroups
        },
        brand: {
          brandId: `brd_${slugify(prod.brand)}`,
          name: prod.brand,
          country: 'Global',
          isPremium: false,
          trustScore: 95
        },
        pricing: {
          basePrice: prod.unitPrice,
          currency: 'USD',
          discount: { type: 'NONE', value: 0 },
          tax: { rate: 10 },
          shippingCost: 2.5,
          finalPrice: prod.unitPrice // will be auto-calculated but pre-filling it satisfies schema validation
        },
        inventory: {
          availableStock: 5000,
          reservedStock: 0,
          soldStock: 0,
          damagedStock: 0,
          reorderThreshold: 10,
          inventoryStatus: 'IN_STOCK'
        },
        search: {
          normalizedName: prod.name.toLowerCase(),
          autocompleteTerms: [prod.name],
          searchableKeywords: [slugify(prod.name), slugify(prod.brand), slugify(prod.category)],
          popularityScore: 90
        }
      });
    }

    const productBatchSize = 500;
    for (let i = 0; i < productDocs.length; i += productBatchSize) {
      const batch = productDocs.slice(i, i + productBatchSize);
      await Product.insertMany(batch, { ordered: false });
      logger.info(`Products batch inserted: ${Math.min(i + productBatchSize, productDocs.length)} / ${productDocs.length}`);
    }
    logger.info('All Catalog Products successfully created.');

    // 7. Load and create Orders lifecycle history
    logger.info('Compiling and bulk-inserting Order lifecycle snapshots...');
    const orderDocs = [];

    for (const rec of records) {
      const quantityVal = parseInt(rec.Quantity, 10) || 1;
      const unitPriceVal = parseFloat(rec.UnitPrice) || 10.00;
      const discountVal = parseFloat(rec.Discount) || 0;
      const taxVal = parseFloat(rec.Tax) || 0;
      const shippingVal = parseFloat(rec.ShippingCost) || 0;
      const totalAmountVal = parseFloat(rec.TotalAmount) || (unitPriceVal * quantityVal);

      const custObj = uniqueCustomers.get(rec.CustomerID);
      const categoryId = `cat_${slugify(rec.Category)}`;

      const orderItem = {
        orderId: rec.OrderID,
        customerSnapshot: {
          userId: rec.CustomerID,
          email: custObj ? custObj.email : 'buyer@gmail.com',
          firstName: custObj ? custObj.firstName : 'Buyer',
          lastName: custObj ? custObj.lastName : 'User',
          phone: '1-800-555-0100'
        },
        products: [
          {
            productSnapshot: {
              productId: rec.ProductID,
              sku: `SKU-${rec.ProductID}`,
              name: rec.ProductName,
              shortDescription: `Premium high quality ${rec.ProductName}.`,
              categoryPath: [rec.Category],
              brandName: rec.Brand
            },
            pricingSnapshot: {
              basePrice: unitPriceVal,
              discountType: discountVal > 0 ? 'PERCENTAGE' : 'NONE',
              discountValue: discountVal * 100,
              taxRate: (taxVal / (unitPriceVal * quantityVal)) * 100,
              shippingCost: shippingVal,
              finalPricePerUnit: unitPriceVal
            },
            quantity: quantityVal
          }
        ],
        paymentSnapshot: {
          paymentId: `pay_${rec.OrderID.substring(3)}`,
          method: rec.PaymentMethod === 'Credit Card' ? 'CREDIT_CARD' :
                  rec.PaymentMethod === 'Debit Card' ? 'DEBIT_CARD' :
                  rec.PaymentMethod === 'PayPal' ? 'PAYPAL' : 'COD',
          status: rec.OrderStatus === 'Cancelled' ? 'FAILED' : 'COMPLETED',
          amount: totalAmountVal,
          transactionId: `txn_${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`,
          paidAt: new Date(rec.OrderDate)
        },
        shippingSnapshot: {
          carrier: 'DHL',
          trackingNumber: `TRK${rec.OrderID.substring(3)}`,
          address: {
            street: 'Main Street Suite 100',
            city: rec.City || 'Seattle',
            state: rec.State || 'WA',
            zip: '98101',
            country: rec.Country || 'United States'
          }
        },
        status: rec.OrderStatus === 'Delivered' ? 'DELIVERED' :
                rec.OrderStatus === 'Cancelled' ? 'CANCELLED' :
                rec.OrderStatus === 'Shipped' ? 'SHIPPED' : 'PENDING',
        fulfillment: {
          status: rec.OrderStatus === 'Delivered' ? 'FULFILLED' :
                  rec.OrderStatus === 'Shipped' ? 'PARTIALLY_FULFILLED' : 'UNFULFILLED',
          dispatchedAt: new Date(rec.OrderDate),
          deliveredAt: rec.OrderStatus === 'Delivered' ? new Date(rec.OrderDate) : undefined
        },
        analyticsSnapshot: {
          subtotalAmount: parseFloat((unitPriceVal * quantityVal).toFixed(2)),
          discountAmount: parseFloat((discountVal * unitPriceVal * quantityVal).toFixed(2)),
          taxAmount: parseFloat(taxVal.toFixed(2)),
          shippingAmount: parseFloat(shippingVal.toFixed(2)),
          totalRevenue: parseFloat(totalAmountVal.toFixed(2))
        },
        system: {
          isDeleted: false
        }
      };

      orderDocs.push(orderItem);
    }

    const orderBatchSize = 1000;
    for (let i = 0; i < orderDocs.length; i += orderBatchSize) {
      const batch = orderDocs.slice(i, i + orderBatchSize);
      await Order.insertMany(batch, { ordered: false });
      logger.info(`Orders batch inserted: ${Math.min(i + orderBatchSize, orderDocs.length)} / ${orderDocs.length}`);
    }

    logger.info('Database import completed successfully!');
    logger.info(`Global Admin login credentials: email: "admin@commerce.com", password: "${defaultPassword}"`);

  } catch (error) {
    logger.error('CRITICAL: Ingestion script encountered a fatal exception!', error);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection pool cleanly closed.');
  }
};

importDataset();

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
      firstName: 'Raushan',
      lastName: 'kumar',
      role: 'SUPER_ADMIN',
      permissions: ['VIEW_ANALYTICS', 'MANAGE_INVENTORY', 'VIEW_PRODUCTS', 'MANAGE_ORDERS'],
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

    // Create additional Categories to populate sidebar filters
    const catPhones = await Category.create({
      categoryId: 'cat_phones77',
      name: 'Smartphones',
      slug: 'smartphones',
      hierarchy: { main: 'Electronics', sub: 'Mobile', leaf: 'Phones' },
      path: ['Electronics', 'Mobile', 'Phones'],
      searchableTags: ['phone', 'mobile', 'smartphone', 'ios', 'android'],
      recommendationGroups: ['Electronics-Mobile']
    });

    const catApparel = await Category.create({
      categoryId: 'cat_apparel66',
      name: 'Designer Apparel',
      slug: 'designer-apparel',
      hierarchy: { main: 'Apparel', sub: 'Fashion', leaf: 'Shirts' },
      path: ['Apparel', 'Fashion', 'Shirts'],
      searchableTags: ['clothing', 'fashion', 'shirt', 'brand', 'designer'],
      recommendationGroups: ['Apparel-Fashion']
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
        weight: { value: 0.05, unit: 'kg' },
        images: [
          'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80', // Front side (open case showing buds)
          'https://images.unsplash.com/photo-1590658268010-854b73b54a9d?auto=format&fit=crop&w=600&q=80', // Side angle view
          'https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=600&q=80'  // Upper back side view of the case
        ]
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
        weight: { value: 2.1, unit: 'kg' },
        images: [
          'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80', // Front side (open screen view)
          'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=80', // Side angle profile view
          'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80'  // Upper back side casing view
        ]
      },
      category: {
        categoryId: catLaptops.categoryId,
        hierarchy: catLaptops.hierarchy,
        path: catLaptops.path,
        searchableTags: catLaptops.searchableTags,
        recommendationGroups: catLaptops.recommendationGroups
      },
      brand: {
        brandId: 'brd_apex_comp',
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

    // Brand: Global -> Category: Smartphones
    const productPhone = await Product.create({
      identity: {
        productId: 'prod_phone789',
        sku: 'SKU-GLB-554433',
        slug: 'global-vision-phone',
        barcode: '112233445566'
      },
      core: {
        name: 'Global Vision Phone',
        shortDescription: 'Modern flagship smartphone with dynamic display and cinematic camera.',
        fullDescription: 'High resolution screen, fast processing, and 5G network integration.',
        technicalSpecifications: { Screen: '6.7 inch OLED', Battery: '5000mAh', Camera: '108MP' },
        dimensions: { width: 16, height: 7.5, depth: 0.8, unit: 'cm' },
        weight: { value: 0.18, unit: 'kg' },
        images: [
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80', // Front view phone
          'https://images.unsplash.com/photo-1565630916779-e303be97b6f5?auto=format&fit=crop&w=600&q=80', // Side angle view
          'https://images.unsplash.com/photo-1573148195900-7845dcb9b127?auto=format&fit=crop&w=600&q=80'  // Upper back side view
        ]
      },
      category: {
        categoryId: catPhones.categoryId,
        hierarchy: catPhones.hierarchy,
        path: catPhones.path,
        searchableTags: catPhones.searchableTags,
        recommendationGroups: catPhones.recommendationGroups
      },
      brand: {
        brandId: 'brd_global',
        name: 'Global',
        country: 'USA',
        isPremium: false,
        trustScore: 90
      },
      pricing: {
        basePrice: 800.00,
        currency: 'USD',
        discount: { type: 'PERCENTAGE', value: 15 }, // $680
        tax: { rate: 8 }, // 8% tax -> $734.40
        shippingCost: 15 // shipping -> $749.40 final price
      },
      inventory: {
        availableStock: 50,
        reorderThreshold: 10,
        inventoryStatus: 'IN_STOCK'
      },
      search: {
        autocompleteTerms: ['Global Vision Phone', 'global-vision-phone', 'Global'],
        searchableKeywords: ['global', 'vision', 'phone', 'smartphone', 'mobile', 'camera', 'electronics'],
        popularityScore: 88
      }
    });

    // Brand: USA -> Category: Designer Apparel
    const productShirt = await Product.create({
      identity: {
        productId: 'prod_shirt111',
        sku: 'SKU-USA-221100',
        slug: 'usa-patriot-shirt',
        barcode: '223344556677'
      },
      core: {
        name: 'USA Patriot Shirt',
        shortDescription: 'Premium cotton designer shirt highlighting iconic patterns.',
        fullDescription: 'Comfortable fit, high grade breathability, and authentic colors.',
        technicalSpecifications: { Material: '100% Cotton', Fit: 'Relaxed', Color: 'Blue' },
        dimensions: { width: 30, height: 40, depth: 2, unit: 'cm' },
        weight: { value: 0.25, unit: 'kg' },
        images: [
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80', // Front view shirt
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80', // Side angle view
          'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80'  // Upper back side view
        ]
      },
      category: {
        categoryId: catApparel.categoryId,
        hierarchy: catApparel.hierarchy,
        path: catApparel.path,
        searchableTags: catApparel.searchableTags,
        recommendationGroups: catApparel.recommendationGroups
      },
      brand: {
        brandId: 'brd_usa',
        name: 'USA',
        country: 'USA',
        isPremium: false,
        trustScore: 85
      },
      pricing: {
        basePrice: 50.00,
        currency: 'USD',
        discount: { type: 'PERCENTAGE', value: 20 }, // $40
        tax: { rate: 5 }, // 5% tax -> $42
        shippingCost: 5 // shipping -> $47 final price
      },
      inventory: {
        availableStock: 120,
        reorderThreshold: 15,
        inventoryStatus: 'IN_STOCK'
      },
      search: {
        autocompleteTerms: ['USA Patriot Shirt', 'usa-patriot-shirt', 'USA'],
        searchableKeywords: ['usa', 'patriot', 'shirt', 'clothing', 'fashion', 'apparel'],
        popularityScore: 78
      }
    });

    // Let's seed 9 more Wireless Earbuds (Total: 10 earbuds) with distinct Unsplash URLs
    const earbudData = [
      { id: '1', name: 'Sonic Pro Buds', price: 120, brand: 'Apex Audio', desc: 'Ultra latency wireless earbuds for professional gaming.', img: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80'] },
      { id: '2', name: 'BassDrop ANC X', price: 90, brand: 'Global', desc: 'Powerful low-end response with isolation filters.', img: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'] },
      { id: '3', name: 'ComfortFit Pods', price: 75, brand: 'USA', desc: 'Ergonomic shape designed for extensive active daily use.', img: ['https://images.unsplash.com/photo-1577174881658-0f30ed549adc?auto=format&fit=crop&w=600&q=80'] },
      { id: '4', name: 'Acoustic Pure Wave', price: 150, brand: 'Apex Audio', desc: 'Audiophile grade dynamic drivers with lossless sound codec.', img: ['https://images.unsplash.com/photo-1585298723682-7115561c51b7?auto=format&fit=crop&w=600&q=80'] },
      { id: '5', name: 'Apex Elite Buds 2', price: 210, brand: 'Apex Audio', desc: 'Custom soundstage curves with premium leather case design.', img: ['https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80'] },
      { id: '6', name: 'Hifi Pure Tune', price: 135, brand: 'Apex Audio', desc: 'Pure acoustic reproduction with hybrid drive architecture.', img: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80'] },
      { id: '7', name: 'Sport Fit Air', price: 80, brand: 'Global', desc: 'Sweatproof wrap-around hooks for runners and athletes.', img: ['https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=600&q=80'] },
      { id: '8', name: 'Crystal Vocal Pods', price: 95, brand: 'USA', desc: 'Optimized voice microphones for calls and video meetings.', img: ['https://images.unsplash.com/photo-1577174881658-0f30ed549adc?auto=format&fit=crop&w=600&q=80'] },
      { id: '9', name: 'Apex Audio Solo', price: 110, brand: 'Apex Audio', desc: 'Ultra minimal earbud shell casing with massive battery.', img: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80'] }
    ];

    for (const item of earbudData) {
      await Product.create({
        identity: { productId: `prod_earbuds_add_${item.id}`, sku: `SKU-EAR-${item.id}09`, slug: `earbuds-add-${item.id}` },
        core: {
          name: item.name,
          shortDescription: item.desc,
          technicalSpecifications: { Bluetooth: 'v5.3', Battery: '24 Hours' },
          dimensions: { width: 5, height: 5, depth: 3, unit: 'cm' },
          weight: { value: 0.04, unit: 'kg' },
          images: item.img
        },
        category: { categoryId: catEarbuds.categoryId, hierarchy: catEarbuds.hierarchy, path: catEarbuds.path, searchableTags: catEarbuds.searchableTags, recommendationGroups: catEarbuds.recommendationGroups },
        brand: { brandId: `brd_${item.brand.toLowerCase().replace(/ /g, '_')}`, name: item.brand, country: 'Germany', isPremium: true, trustScore: 95 },
        pricing: { basePrice: item.price, currency: 'USD', discount: { type: 'PERCENTAGE', value: 5 }, tax: { rate: 8 }, shippingCost: 4 },
        inventory: { availableStock: 80, reorderThreshold: 10, inventoryStatus: 'IN_STOCK' },
        search: { autocompleteTerms: [item.name], searchableKeywords: ['earbuds', 'audio', 'sound'], popularityScore: 80 }
      });
    }

    // Seed 9 more Pro Laptops (Total: 10 laptops)
    const laptopData = [
      { id: '1', name: 'Apex Slim Slate 14', price: 1100, brand: 'Apex Computers', desc: 'Ultraportable productivity companion with battery.', img: ['https://images.unsplash.com/photo-1496181130204-755241544eab?auto=format&fit=crop&w=600&q=80'] },
      { id: '2', name: 'Workstation Extreme 17', price: 2300, brand: 'Apex Computers', desc: 'Desktop replacement powerhouse with GPU acceleration.', img: ['https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80'] },
      { id: '3', name: 'Global Book Flex', price: 950, brand: 'Global', desc: '2-in-1 convertible touchscreen laptop.', img: ['https://images.unsplash.com/photo-1585076694015-680fa4e835e9?auto=format&fit=crop&w=600&q=80'] },
      { id: '4', name: 'Patriot Alpha Workstation', price: 1400, brand: 'USA', desc: 'Solid enterprise-ready secure work laptop.', img: ['https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80'] },
      { id: '5', name: 'Apex EliteBook 15', price: 1750, brand: 'Apex Computers', desc: 'CNC machined unibody developer machine.', img: ['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80'] },
      { id: '6', name: 'Apex Creator Pro 16', price: 1899, brand: 'Apex Computers', desc: 'Dedicated color accurate OLED panel for designers.', img: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80'] },
      { id: '7', name: 'Global Slate Light 13', price: 799, brand: 'Global', desc: 'Budget friendly chrome-casing notebook.', img: ['https://images.unsplash.com/photo-1496181130204-755241544e35?auto=format&fit=crop&w=600&q=80'] },
      { id: '8', name: 'Patriot Carbon Pro 14', price: 1250, brand: 'USA', desc: 'Carbon weave light frame for business travel.', img: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80'] },
      { id: '9', name: 'Apex Developer Edge', price: 1550, brand: 'Apex Computers', desc: 'Preinstalled with Linux, core developer build.', img: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=80'] }
    ];

    for (const item of laptopData) {
      await Product.create({
        identity: { productId: `prod_laptop_add_${item.id}`, sku: `SKU-LAP-${item.id}23`, slug: `laptop-add-${item.id}` },
        core: {
          name: item.name,
          shortDescription: item.desc,
          technicalSpecifications: { CPU: 'Intel i7 / AMD Ryzen 7', Memory: '16GB DDR5' },
          dimensions: { width: 32, height: 22, depth: 1.5, unit: 'cm' },
          weight: { value: 1.6, unit: 'kg' },
          images: item.img
        },
        category: { categoryId: catLaptops.categoryId, hierarchy: catLaptops.hierarchy, path: catLaptops.path, searchableTags: catLaptops.searchableTags, recommendationGroups: catLaptops.recommendationGroups },
        brand: { brandId: `brd_${item.brand.toLowerCase().replace(/ /g, '_')}`, name: item.brand, country: 'USA', isPremium: true, trustScore: 97 },
        pricing: { basePrice: item.price, currency: 'USD', discount: { type: 'PERCENTAGE', value: 8 }, tax: { rate: 6 }, shippingCost: 20 },
        inventory: { availableStock: 30, reorderThreshold: 5, inventoryStatus: 'IN_STOCK' },
        search: { autocompleteTerms: [item.name], searchableKeywords: ['laptop', 'pc', 'computer'], popularityScore: 85 }
      });
    }

    // Seed 9 more Smartphones (Total: 10 phones)
    const phoneData = [
      { id: '1', name: 'Global Pro Vision X', price: 999, brand: 'Global', desc: 'Cinematic layout with telephoto optics.', img: ['https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&q=80'] },
      { id: '2', name: 'Apex Speak Core', price: 650, brand: 'Apex Audio', desc: 'Secure smartphone with premium DAC audio chips.', img: ['https://images.unsplash.com/photo-1533228894084-d9b897ecd001?auto=format&fit=crop&w=600&q=80'] },
      { id: '3', name: 'Patriot Mobile Armor', price: 500, brand: 'USA', desc: 'Rugged water-resistant structure built for high environments.', img: ['https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&w=600&q=80'] },
      { id: '4', name: 'Global Lite Phone', price: 350, brand: 'Global', desc: 'Balanced features with exceptional battery life.', img: ['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80'] },
      { id: '5', name: 'Global Ultra Max', price: 1200, brand: 'Global', desc: 'Ultimate flagship specs with foldable dynamic screen.', img: ['https://images.unsplash.com/photo-1551645121-d1034da75057?auto=format&fit=crop&w=600&q=80'] },
      { id: '6', name: 'Patriot Active Shield', price: 450, brand: 'USA', desc: 'Shatterproof glass screen protector built in.', img: ['https://images.unsplash.com/photo-1546054454-aa26e2b734c7?auto=format&fit=crop&w=600&q=80'] },
      { id: '7', name: 'Global Vision Neo', price: 550, brand: 'Global', desc: 'Mid-range device with clean stock android experience.', img: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80'] },
      { id: '8', name: 'Apex Prime Mobile', price: 850, brand: 'Apex Audio', desc: 'Stunning premium design with glass back layout.', img: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80'] },
      { id: '9', name: 'Global Pocket Fold', price: 1100, brand: 'Global', desc: 'Compact vertically folding touch screen phone.', img: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80'] }
    ];

    for (const item of phoneData) {
      await Product.create({
        identity: { productId: `prod_phone_add_${item.id}`, sku: `SKU-PHN-${item.id}55`, slug: `phone-add-${item.id}` },
        core: {
          name: item.name,
          shortDescription: item.desc,
          technicalSpecifications: { Screen: '6.5 inch LCD/OLED', Network: '5G' },
          dimensions: { width: 15, height: 7, depth: 0.9, unit: 'cm' },
          weight: { value: 0.17, unit: 'kg' },
          images: item.img
        },
        category: { categoryId: catPhones.categoryId, hierarchy: catPhones.hierarchy, path: catPhones.path, searchableTags: catPhones.searchableTags, recommendationGroups: catPhones.recommendationGroups },
        brand: { brandId: `brd_${item.brand.toLowerCase().replace(/ /g, '_')}`, name: item.brand, country: 'Global', isPremium: true, trustScore: 92 },
        pricing: { basePrice: item.price, currency: 'USD', discount: { type: 'PERCENTAGE', value: 12 }, tax: { rate: 7 }, shippingCost: 10 },
        inventory: { availableStock: 45, reorderThreshold: 8, inventoryStatus: 'IN_STOCK' },
        search: { autocompleteTerms: [item.name], searchableKeywords: ['phone', 'mobile', 'smartphone'], popularityScore: 82 }
      });
    }

    // Seed 9 more Apparel Shirts (Total: 10 apparel items)
    const apparelData = [
      { id: '1', name: 'USA Retro Classic Fit', price: 45, brand: 'USA', desc: '100% heavy fabric retro vintage style shirt.', img: ['https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80'] },
      { id: '2', name: 'Global Fit Comfort Collar', price: 60, brand: 'Global', desc: 'Corporate smart casual dress shirt.', img: ['https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80'] },
      { id: '3', name: 'Apex Tech Tee', price: 35, brand: 'Apex Audio', desc: 'Sweat-wicking synthetic running t-shirt.', img: ['https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=600&q=80'] },
      { id: '4', name: 'Patriot Wind Runner', price: 85, brand: 'USA', desc: 'Weatherproof lightweight running shell jacket.', img: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80'] },
      { id: '5', name: 'Heritage Comfort Flannel', price: 65, brand: 'USA', desc: 'Heavy double brushed warm flannel shirt.', img: ['https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=600&q=80'] },
      { id: '6', name: 'Heritage Indigo Denim', price: 75, brand: 'USA', desc: 'Genuine rugged raw indigo denim shirt.', img: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80'] },
      { id: '7', name: 'Global Premium Linen', price: 55, brand: 'Global', desc: 'Lightweight linen shirt for warm climate travel.', img: ['https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80'] },
      { id: '8', name: 'Patriot Combat Fleece', price: 95, brand: 'USA', desc: 'Sherpa-lined heavy tactical utility jacket.', img: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80'] },
      { id: '9', name: 'USA Classic Oxford', price: 50, brand: 'USA', desc: 'Timeless combed cotton formal oxford button-down.', img: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80'] }
    ];

    for (const item of apparelData) {
      await Product.create({
        identity: { productId: `prod_apparel_add_${item.id}`, sku: `SKU-APP-${item.id}88`, slug: `apparel-add-${item.id}` },
        core: {
          name: item.name,
          shortDescription: item.desc,
          technicalSpecifications: { Material: 'Cotton / Poly Blend', Fit: 'Standard' },
          dimensions: { width: 28, height: 38, depth: 1.5, unit: 'cm' },
          weight: { value: 0.22, unit: 'kg' },
          images: item.img
        },
        category: { categoryId: catApparel.categoryId, hierarchy: catApparel.hierarchy, path: catApparel.path, searchableTags: catApparel.searchableTags, recommendationGroups: catApparel.recommendationGroups },
        brand: { brandId: `brd_${item.brand.toLowerCase().replace(/ /g, '_')}`, name: item.brand, country: 'USA', isPremium: false, trustScore: 90 },
        pricing: { basePrice: item.price, currency: 'USD', discount: { type: 'PERCENTAGE', value: 10 }, tax: { rate: 5 }, shippingCost: 6 },
        inventory: { availableStock: 90, reorderThreshold: 12, inventoryStatus: 'IN_STOCK' },
        search: { autocompleteTerms: [item.name], searchableKeywords: ['shirt', 'apparel', 'apparel', 'fashion'], popularityScore: 75 }
      });
    }

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

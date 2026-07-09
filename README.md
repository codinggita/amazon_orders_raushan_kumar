<div align="center">
  <img src="./docs/assets/cartx-hero-v3.png" alt="CartX Platform Hero" width="100%" style="border-radius: 12px; margin-bottom: 20px;" />
  
  # 🛒 CartX - Premium E-Commerce Orchestration

  <p align="center">
    A high-performance, production-grade distributed system designed to deliver real-time commerce dashboard metrics, atomic inventory control, and enterprise-grade user lifecycle tracking.
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node" />
    <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  </p>
</div>

---

## 🌟 Executive Summary

Built using a **Strict Clean Layered Architecture** with Node.js, Express.js, and MongoDB Atlas on the backend, and a stunning, high-performance React (Vite) Single Page Application on the frontend. The CartX platform houses both a robust transactional backend service and a visually striking, consumer-facing storefront and analytics dashboard UI.

<img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" alt="Analytics Dashboard" width="100%" style="border-radius: 12px; margin-top: 10px;" />

---

## 🚀 Enterprise Core Technical Features

### Backend Engine
* **High-Performance Ingestion Engine**: Dynamically converts raw JSON records containing **21,629 orders** into a standardized CSV file, parsing it line-by-line using a custom quote-tolerant parser, and seeding MongoDB Atlas in highly optimized chunked batches.
* **Atomic Stock Booking Engine**: Employs two-phase stock locking checks in MongoDB using atomic `$inc` operators to mitigate concurrency race conditions, featuring automatic transaction rollbacks on failures to prevent catalog leaks.
* **Observability & Request Tracing**: Cryptographic trace ID generation (`crypto.randomUUID()`) injected automatically in each HTTP request context for instant transactional diagnostics.

### Frontend Storefront
* **Zero-Latency Interactions**: Integrated with `@tanstack/react-query` for ultra-fast, cached data fetching, paginated catalog scrolling, and dynamic state management.
* **Modern Premium UI/UX**: Utilizing Tailwind CSS and Framer Motion, the CartX platform features a state-of-the-art "billion-dollar tech giant" aesthetic. Complete with glassmorphism panels, dynamic glows, and micro-interactions.
* **SEO & PWA Ready**: Fully optimized with `react-helmet-async` for dynamic meta tags (Open Graph & Twitter Cards), `sitemap.xml`, Google Rich Snippets (JSON-LD), and Web App Manifests for progressive mobile installation.

---

## 🏗️ System Architecture Blueprint

<img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop" alt="System Architecture" width="100%" style="border-radius: 12px; margin-top: 10px;" />

```text
amazon_orders_raushan_kumar/
├── backend/                                    # Enterprise Backend Engine (Node.js/Express)
│   ├── src/
│   │   ├── api/                                # HTTP Routing and Request Orchestration
│   │   │   ├── controllers/                    # Adapters converting HTTP requests to Domain logic
│   │   │   │   ├── admin.controller.js         # User suspensions and system metric lookups
│   │   │   │   ├── analytics.controller.js     # Sales facets and geolocation grouping logic
│   │   │   │   ├── auth.controller.js          # Authentication (signups, passwords, logins)
│   │   │   │   ├── category.controller.js      # Taxonomy category node creations & lookups
│   │   │   │   ├── customer.controller.js      # Shopper profiles and personal transaction history
│   │   │   │   ├── health.controller.js        # Server and database ping health checks
│   │   │   │   ├── inventory.controller.js     # Stock metrics and manual stock level overrides
│   │   │   │   ├── order.controller.js         # Checkout execution and payment webhooks
│   │   │   │   ├── product.controller.js       # Paginated catalog multi-filter searches
│   │   │   │   └── seller.controller.js        # Merchant directories and storefront analytics
│   │   │   └── routes/                         # Express Routers mapping endpoints to controllers
│   │   ├── configs/                            # Environment-specific Configurations (.env parsers)
│   │   ├── domain/                             # Core Enterprise Business Rules
│   │   │   ├── repositories/                   # Layer-isolated Mongoose database commands
│   │   │   │   ├── category.repository.js      # Category taxonomy tree materialized paths
│   │   │   │   ├── customer.repository.js      # Customer accounts lookups & soft-deletes
│   │   │   │   ├── order.repository.js         # Order database writes and state machine updates
│   │   │   │   ├── product.repository.js       # Products queries & atomic stock reservations
│   │   │   │   ├── seller.repository.js        # Merchant performance metrics database scans
│   │   │   │   └── user.repository.js          # User security profile operations (RBAC)
│   │   │   └── services/                       # Application Workflow Services Orchestration
│   │   │       ├── admin.service.js            # User suspensions and backend OS diagnostics
│   │   │       ├── analytics.service.js        # High-performance analytical MongoDB aggregations
│   │   │       ├── auth.service.js             # Password hashing, JWT token generation
│   │   │       ├── category.service.js         # Array generations for taxonomy tree branches
│   │   │       ├── customer.service.js         # Shopper listings compilation
│   │   │       ├── inventory.service.js        # Manual inventory overrides
│   │   │       ├── order.service.js            # Multi-item checkout distributed locking
│   │   │       ├── product.service.js          # Catalog paginated search engines
│   │   │       ├── search.service.js           # Multi-entity search indexing and typo-tolerance
│   │   │       └── seller.service.js           # Merchant performance calculations
│   │   ├── infrastructure/                     # Technical Adapters & Database Engines
│   │   │   ├── database/                       # MongoDB Cloud Atlas Connection Pooling
│   │   │   └── logger/                         # Winston Structured Logging (RFC 5424)
│   │   ├── middlewares/                        # Express HTTP Pipeline Middlewares
│   │   │   ├── auth.middleware.js              # Token decryptions and Role RBAC guards
│   │   │   └── trace.middleware.js             # UUID request trace injectors for logging
│   │   └── seed/                               # Database Ingestion & Testing Mockers
│   │       ├── importDatasetCsv.js             # High-performance JSON-to-CSV database seeder
│   │       └── seed.js                         # Bootstraps SuperAdmin and default mock data
│   └── app.js                                  # Express instantiation and global security helmet
│
├── frontend/                                   # Commerce Analytics & Storefront Client (React/Vite)
│   ├── src/
│   │   ├── components/                         # Reusable UI presentation layers
│   │   │   ├── Toast.jsx                       # Global floating notification HUD manager
│   │   │   └── HeroBackground.jsx              # Cinematic glowing particle animations
│   │   ├── layouts/                            # Outer structural routing wrappers
│   │   │   ├── AdminLayout.jsx                 # Sidebar navigation for staff and analytics
│   │   │   └── ShopperLayout.jsx               # Navigation bar and footer for public storefront
│   │   ├── pages/                              # Core interactive UI screens
│   │   │   ├── AdminAnalytics.jsx              # High-charts visualization of sales facets
│   │   │   ├── AdminCategories.jsx             # Taxonomy tree management UI
│   │   │   ├── AdminDashboard.jsx              # Executive metrics overview dashboard
│   │   │   ├── AdminMetrics.jsx                # Server OS and database latency monitors
│   │   │   ├── AdminOrders.jsx                 # Order fulfillment and status progression table
│   │   │   ├── AdminProducts.jsx               # Catalog inventory addition and pricing management
│   │   │   ├── AdminUsers.jsx                  # IAM user suspension and directory
│   │   │   ├── AuthPages.jsx                   # Sign In, Registration, and Password Reset screens
│   │   │   ├── LandingPage.jsx                 # Cinematic entry point for the CartX platform
│   │   │   ├── NotFound.jsx                    # 404 Fallback routing for lost navigations
│   │   │   ├── ShopperCatalog.jsx              # Multi-filter paginated product discovery grid
│   │   │   ├── ShopperProductDetails.jsx       # Individual product specification and checkout injection
│   │   │   └── WarehouseOverrides.jsx          # Direct manual stock quantity mutations for staff
│   │   ├── services/                           # Network boundary configuration
│   │   │   ├── api.js                          # Configured Axios instance with JWT interceptors
│   │   │   └── resourceApi.js                  # Pre-compiled fetch hooks for React Query
│   │   ├── store/                              # Global frontend state machines (Zustand)
│   │   │   ├── useAuthStore.js                 # Session tracking and role capabilities
│   │   │   └── useCartStore.js                 # Local storage persistent shopping cart
│   │   ├── App.jsx                             # React Router definition map and entry DOM tree
│   │   └── main.jsx                            # React root injection and HelmetProvider wrapper
│   └── public/                                 # Static web server assets
│       ├── manifest.json                       # Progressive Web App installation definitions
│       ├── robots.txt                          # Search engine bot crawl directives
│       ├── sitemap.xml                         # XML priority mapping for SEO indexing
│       └── cartx-logo.png                      # The primary CartX visual identity branding
```

---

## 🔑 Cloud Database & Environment Configuration

### Backend Setup
Create a `.env` file in the `backend/` root directory:

```env
PORT=5001
NODE_ENV=development

# MongoDB Connection String (Atlas Cluster URI)
MONGODB_URI=mongodb+srv://Raushankumar0720:Raushan%40150720@bynd.ollivm8.mongodb.net/commerce_intelligence?retryWrites=true&w=majority&appName=BYND

# JWT Security Configurations
JWT_SECRET=commerce_intelligence_local_development_jwt_secret_key_998877
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
BCRYPT_SALT_ROUNDS=12
```

### 👤 Global Administrator Access Credentials
Logging in as Admin grants immediate access to all administrative and business intelligence analytical routes:
* **Email**: `admin@commerce.com`
* **Password**: `SecurityPassword99!`

---

## 📡 REST API Endpoint Overview (48 Endpoints)

All backend endpoints are mapped under the `/api/v1` namespace and strictly follow RESTful conventions.

* **Identity Management**: `/auth/register`, `/auth/login`, `/auth/change-password`
* **Products & Taxonomy**: `/products`, `/categories`, `/search/products`
* **Orders & Checkout**: `/orders` (Two-phase commit), `/orders/:id/pay`, `/orders/:id/cancel`
* **Inventory & Overrides**: `/inventory/:productId` (Atomic operations)
* **Sales Intelligence**: `/analytics/revenue`, `/analytics/top-products`, `/analytics/category-sales`

---

## ⚡ Quick Boot & Installation Guide

To run the full-stack platform locally:

### 1. Boot the Backend (API & Database)
```bash
cd amazon_orders_raushan_kumar/backend
npm install

# Perform JSON-to-CSV Cloud Database Atlas Ingestion
node src/seed/importDatasetCsv.js

# Boot up the Express HTTP server (Runs on port 5001)
npm start
```

### 2. Boot the Frontend (CartX UI)
Open a new terminal window:
```bash
cd amazon_orders_raushan_kumar/frontend
npm install

# Boot the Vite React Application (Runs on port 5173)
npm run dev
```

Your cloud-connected database is now fully populated, and the complete distributed system is live! 🚀

---
<div align="center">
  <img src="https://images.unsplash.com/photo-1580828343064-fde4cad202d5?q=80&w=2070&auto=format&fit=crop" alt="Logistics and Commerce" width="100%" style="border-radius: 12px; margin-top: 20px; opacity: 0.8;" />
  <p><em>Engineered for speed, scale, and uncompromising security.</em></p>
</div>
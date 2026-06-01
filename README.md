# 🛒 Amazon Commerce & Analytics Intelligence Platform

Welcome to the **Amazon Commerce & Analytics Intelligence Platform**—a high-performance, production-grade distributed system designed to deliver real-time commerce dashboard metrics, atomic inventory control, and enterprise-grade user lifecycle tracking. 

Built using a **Strict Clean Layered Architecture** with Node.js, Express.js, and MongoDB Atlas, this repository houses both the robust transactional backend service and the integrated analytics dashboard UI.

---

## 🏗️ 1. Project Directory & Architecture Blueprint

Below is the complete, comprehensive directory mapping of every engineered component of this distributed system, showcasing pure isolation of business rules from database adapters and HTTP delivery routers:

```
amazon_orders_raushan_kumar/
├── backend/                                    # Enterprise Backend Engine (Node.js/Express)
│   ├── src/
│   │   ├── api/                                # HTTP Routing and Request Orchestration
│   │   │   ├── controllers/                    # Business adapters converting requests to ApiResponses
│   │   │   │   ├── admin.controller.js         # User suspensions and system metric lookups
│   │   │   │   ├── analytics.controller.js     # Dashboards, category sales, geographic splits
│   │   │   │   ├── auth.controller.js          # Authentication (signups, passwords, logins)
│   │   │   │   ├── category.controller.js      # Taxonomy category node creations & lookups
│   │   │   │   ├── customer.controller.js      # Shopper profiles and personal transaction history
│   │   │   │   ├── health.controller.js        # Server and database health checks
│   │   │   │   ├── inventory.controller.js     # Stock metrics and manual stock level overrides
│   │   │   │   ├── order.controller.js         # Two-phase checkout orders execution
│   │   │   │   ├── product.controller.js       # Paginated catalog multi-filter searches
│   │   │   │   └── seller.controller.js        # Merchant directories and storefront analytics
│   │   │   └── routes/                         # API Gateway Routers mapping routes to controllers
│   │   │       ├── admin.routes.js             # Secure system admin routes
│   │   │       ├── analytics.routes.js         # Sales & analytical routes
│   │   │       ├── auth.routes.js              # Shopper auth routes
│   │   │       ├── category.routes.js          # Product taxonomy routes
│   │   │       ├── customer.routes.js          # Customer profiles routes
│   │   │       ├── health.routes.js            # Diagnostics routes
│   │   │       ├── inventory.routes.js         # Warehousing inventory routes
│   │   │       ├── order.routes.js             # Checkout orders transactional routes
│   │   │       ├── product.routes.js           # Products catalog routes
│   │   │       ├── search.routes.js            # High-speed open search routes
│   │   │       └── seller.routes.js            # Sellers storefront routes
│   │   │
│   │   ├── configs/                            # Environment-specific Configurations
│   │   │   └── env.config.js                   # Schema validations for MONGODB_URI and JWT keys
│   │   │
│   │   ├── domain/                             # Core Enterprise Business Rules
│   │   │   ├── repositories/                   # Layer-isolated Mongoose database commands
│   │   │   │   ├── category.repository.js      # Category taxonomy tree queries
│   │   │   │   ├── customer.repository.js      # Customer accounts lookups & soft-deletes
│   │   │   │   ├── order.repository.js         # Order database writes and status updates
│   │   │   │   ├── product.repository.js       # Products catalog queries & atomic stock reservations
│   │   │   │   ├── seller.repository.js        # Merchant performance metrics database scans
│   │   │   │   └── user.repository.js          # User security profile operations
│   │   │   └── services/                       # Application Workflow Services Orchestration
│   │   │       ├── admin.service.js            # User suspensions and backend diagnostics
│   │   │       ├── analytics.service.js        # High-performance analytical facet streams
│   │   │       ├── auth.service.js             # Password matches, token generation, signup flows
│   │   │       ├── category.service.js         # Path array generations for taxonomy branches
│   │   │       ├── customer.service.js         # Shopper listings compilation
│   │   │       ├── inventory.service.js        # Manual availableStock updates
│   │   │       ├── order.service.js            # Multi-item checkout rolls & rollbacks
│   │   │       ├── product.service.js          # Products catalog paginated query filters
│   │   │       ├── search.service.js           # Multi-entity search across orders/products
│   │   │       └── seller.service.js           # Merchant performance calculations
│   │   │
│   │   ├── infrastructure/                     # Technical Adapters & Database Engines
│   │   │   ├── cache/                          # Redis-ready Cache Adaptors
│   │   │   │   └── index.js                    # Redis client featuring localized InMemory fallback
│   │   │   ├── database/                       # MongoDB Cloud Atlas Pools
│   │   │   │   ├── index.js                    # Database connection hub
│   │   │   │   ├── mongoose.js                 # Mongoose settings and connection events
│   │   │   │   └── models/                     # High-fidelity Database Schemas
│   │   │   │       ├── category.model.js       # Taxonomy categories with path nested hierarchy
│   │   │   │       ├── order.model.js          # Immutable orders with deep snapshots
│   │   │   │       ├── product.model.js        # Products catalog with dynamic pre-validate pricing
│   │   │   │       └── user.model.js           # IAM user model with brute-force lockout hooks
│   │   │   └── logger/                         # Winston Structured Log adapters
│   │   │       └── index.js                    # RFC 5424 aligned multi-level streams console log
│   │   │
│   │   ├── middlewares/                        # Express HTTP Pipeline Middlewares
│   │   │   ├── auth.middleware.js              # Token decryptions and Role RBAC checks
│   │   │   └── trace.middleware.js             # UUID request trace injectors
│   │   │
│   │   ├── seed/                               # Database Ingestion & Seeding adaptation
│   │   │   ├── importDatasetCsv.js             # High-performance JSON-to-CSV database seeder
│   │   │   └── seed.js                         # Mock test dataset generator
│   │   │
│   │   ├── app.js                              # express instantiation and global security boundaries
│   │   └── server.js                           # DB bootstrap and OS process event monitors
│   │
│   ├── .env                                    # Active cloud environment configurations
│   ├── .env.example                            # Blueprint environment configuration
│   ├── package.json                            # Package management dependencies & boot scripts
│   └── README.md                               # Dedicated backend documentation
│
└── frontend/                                   # Commerce Analytics Dashboard Client
```

---

## 🚀 2. Enterprise Core Technical Features

* **High-Performance Ingestion Engine**: Dynamically converts raw JSON records (`Amazon_Orders.json` containing **21,629 orders**) into a standardized, quote-escaped CSV file, parses it line-by-line using a custom quote-tolerant parser, and seeds **MongoDB Atlas** cloud collections in highly optimized chunked batches.
* **Observability & Request Correlation Tracking**: Cryptographic trace ID generation (`crypto.randomUUID()`) injected automatically in each HTTP request context, outputting trace stamps (`[TraceID: x-trace-id]`) in Winston logs to achieve instant transactional diagnostics.
* **Atomic Stock Booking engine**: Employs two-phase stock locking checks in MongoDB using atomic `$inc` operators to mitigate concurrency race conditions, featuring automatic transaction rollbacks on failures to prevent catalog leaks.
* **Granular Role-Based Access Control (RBAC)**: Secure routes protected by JWT tokens and specialized authorization permissions (e.g. `MANAGE_INVENTORY` for staff stock overrides, `VIEW_ANALYTICS` for intelligence metrics).

---

## 🔑 3. Cloud Database Configuration

The backend is configured to connect directly to **MongoDB Atlas**. Create a `.env` file in the `backend/` root directory:

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

# Rate Limits & Logs
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=debug
```

### 👤 Global Administrator Access Credentials
Logging in as Admin grants immediate access to all administrative and business intelligence analytical routes:
* **Email**: `admin@commerce.com`
* **Password**: `SecurityPassword99!`

---

## 📡 4. REST API Endpoint Directory (48 Endpoints)

All endpoints are mapped under the `/api/v1` namespace.

### Domain 1: Observability & Health
* `GET /health` — Server health ping.
* `GET /health/db` — Live cloud database connection ping & latency metrics.

### Domain 2: Identity Management (IAM)
* `POST /auth/register` — Signup new shopper accounts.
* `POST /auth/login` — Login and fetch JWT access authorization token.
* `GET /auth/me` — Resolve active shopper profile details.
* `PATCH /auth/change-password` — Change password.

### Domain 3 & 4: Products Catalog & Categories Taxonomy
* `GET /products` — Paginated catalog listing with search query parameters (`?search=`, `?brand=`, `?category=`, `?minPrice=`, `?maxPrice=`).
* `POST /products` — Add a product to the catalog.
* `GET /products/:productId` — Get product specs.
* `PATCH /products/:productId` — Edit catalog product details.
* `DELETE /products/:productId` — Soft-delete a product.
* `GET /categories` — List taxonomy hierarchical divisions.
* `POST /categories` — Insert new branch category node.
* `GET /categories/:categoryId` — Category detail lookup.
* `PATCH /categories/:categoryId` — Update category branch path.
* `DELETE /categories/:categoryId` — Remove category branch node.

### Domain 5 & 6: Customers & Sellers Stores
* `GET /customers` — Administrative paginated shoppers directory.
* `GET /customers/:customerId` — Shopper details.
* `PATCH /customers/:customerId` — Shopper profile updates.
* `DELETE /customers/:customerId` — Shopper account deactivation (soft-deletes).
* `GET /customers/:customerId/orders` — Shopper transaction history logs.
* `GET /sellers` — Active merchants storefront directory.
* `GET /sellers/:sellerId` — Store performance details.
* `GET /sellers/:sellerId/products` — Store product catalog lists.
* `GET /sellers/:sellerId/analytics` — Store sales performance benchmarks.

### Domain 7 & 8: Orders Checkout & Warehousing Inventory
* `POST /orders` — Checkout transaction with atomic stock reservation.
* `GET /orders/my-orders` — Shopper personal transaction history.
* `GET /orders/:orderId` — Order details.
* `POST /orders/:orderId/pay` — Complete order payment transaction.
* `POST /orders/:orderId/cancel` — Cancel order and release stock.
* `GET /orders` — Administrative paginated orders directory.
* `PATCH /orders/:orderId` — Update order details (tracking, billing, shipping address).
* `PATCH /orders/:orderId/status` — State-machine status transitions (e.g. `CONFIRMED` $\to$ `SHIPPED` $\to$ `DELIVERED`).
* `DELETE /orders/:orderId` — Soft-delete order from active indices.
* `GET /inventory/:productId` — Stock query lookup.
* `PATCH /inventory/:productId` — Manual warehouse stock override (Staff).

### Domain 9: Granular Sales & Distribution Analytics
* `GET /analytics/dashboard` — Overall analytics performance rollup.
* `GET /analytics/revenue` — Revenue metrics over time.
* `GET /analytics/top-products` — Top performing products array.
* `GET /analytics/top-customers` — Top spending buyer accounts.
* `GET /analytics/category-sales` — Sales margins by category path.
* `GET /analytics/brand-sales` — Brand sales margin performance.
* `GET /analytics/country-sales` — Country geographic splits.
* `GET /analytics/state-sales` — State geographic splits.
* `GET /analytics/city-sales` — City geographic splits.
* `GET /analytics/payment-distribution` — Payment methods spread.
* `GET /analytics/order-status` — Order status splits.
* `GET /analytics/seller-performance` — Merchant performance metrics.

### Domain 10 & 11: Enterprise Search & Admin Gateways
* `GET /search/products` — High-speed typo-tolerant catalog keyword search.
* `GET /search/orders` — Search orders by ID, tracking number, email, or phone.
* `GET /admin/users` — Fetch all users in database paginated.
* `GET /admin/system-metrics` — CPU, Memory usage, Node version, and DB latency.
* `PATCH /admin/users/:userId/block` — Block user account.
* `PATCH /admin/users/:userId/unblock` — Unblock user account.

---

## ⚡ 5. Quick Boot & Installation Guide

To run the platform locally:

```bash
# 1. Clone this repository and navigate to the backend folder
cd amazon_orders_raushan_kumar/backend

# 2. Install all structured backend dependencies
npm install

# 3. Perform JSON-to-CSV Cloud Database Atlas Ingestion
node src/seed/importDatasetCsv.js

# 4. Boot up the Express HTTP server
npm start
```

Your cloud-connected database is fully populated, and the platform is live and running at **`http://localhost:5001`**! 🚀
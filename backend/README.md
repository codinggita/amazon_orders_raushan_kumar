# 🚀 Commerce Intelligence Platform - Production-Grade Backend Engine

Welcome to the **Commerce Intelligence Platform Backend**—a high-performance, enterprise-grade, highly scalable distributed system built on Node.js, Express, and MongoDB. This platform is architected to handle Netflix-scale traffic tracing, Amazon-level order immutability, and Flipkart-level high-concurrency atomic stock reservations.

The system features a **Strict Clean Layered Architecture**, cryptographic request correlation tracking, an ingestion pipeline that handles dynamic JSON-to-CSV database seeding, and 48 fully secure RESTful endpoints across 11 core business domains.

---

## 🏗️ 1. Architecture Blueprint & Layers Separation

The system follows a strict decoupling pattern separating business logic from infrastructure adapters:

```
src/
├── api/
│   ├── routes/                # Bound routers (auth, category, product, order, analytics, search, admin)
│   ├── controllers/           # HTTP handlers converting requests and sending standardized ApiResponses
│   
├── domain/
│   ├── services/              # Domain-specific workflows (two-phase checkouts, password hashing, manual overrides)
│   ├── repositories/          # Isolated Mongoose queries & atomic operations shielding the business layer
│   
├── infrastructure/
│   ├── database/              # Mongoose DB connection pool & schemas (User, Category, Product, Order)
│   ├── cache/                 # Redis-ready client featuring localized InMemory fallback maps
│   ├── logger/                # RFC 5424 structured Winston log streams
│   
├── middlewares/               # Cryptographic request trackers, JWT verifiers, role permission guard-rails
└── utils/                     # Custom ApiError validation structures and ApiResponse wrappers
```

---

## 🛠️ 2. Core Technological Architecture

* **Runtime & Framework**: Node.js (ES Modules syntax) & Express.js.
* **Database & ORM**: MongoDB Atlas (Cloud Cluster hosting) & Mongoose.
* **Observability & Diagnostics**:
  * **Winston Structured Logger**: RFC 5424 aligned multi-stream console logging.
  * **Correlation Request Tracer**: Cryptographic tracking token (`crypto.randomUUID()`) injected in each context via `x-trace-id` headers and logged inside Winston streams.
* **Security & Vulnerability Mitigation**:
  * **Helmet.js**: Sets headers to mitigate XSS, clickjacking, and MIME-sniffing.
  * **Express Rate Limit**: Prevents automated brute-force attacks.
  * **Brute-Force Lockout**: Automatically locks user accounts for 1 hour after 5 consecutive failed login attempts.
  * **Centralized Exception Boundaries**: Operational vs unknown error boundaries preventing raw stack leaks in production.

---

## ⚡ 3. The JSON-to-CSV Ingestion Pipeline

To seed your system with high-fidelity analytics data, we built a dedicated, zero-dependency ingestion engine (`src/seed/importDatasetCsv.js`):
1. **JSON Parsing**: Loads the **12MB Amazon Orders** file containing **21,629 raw records**.
2. **CSV Generation**: Maps, quote-escapes, and writes the records to an optimized local [Amazon_Orders.csv](file:///c:/Users/Raushan/Downloads/Amazon_Orders.csv) file.
3. **Chunked Insertion**: Parses the CSV line-by-line using a custom quote-tolerant parser, extracts unique categories, products, customers, and sellers, and bulk-inserts all records into **MongoDB Atlas** in optimized batches.

---

## 🔑 4. Environment Variables Setup & Credentials

Create a `.env` file inside your `/backend` root folder:

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

### 👤 Global Administrator Login Credentials
To unlock administrative endpoints (permissions: `VIEW_ANALYTICS` and `MANAGE_INVENTORY`):
* **Email**: `admin@commerce.com`
* **Password**: `SecurityPassword99!`

---

## 📡 5. Complete REST API Endpoint Directory

All routes are prefixed with `/api/v1`.

### Domain 1: Observability & Health
* `GET /health` — Check server online state.
* `GET /health/db` — Detailed MongoDB Atlas connection ping & latency stats.

### Domain 2: Identity & Access Management (IAM)
* `POST /auth/register` — Signup new shoppers.
* `POST /auth/login` — Signin and acquire rolling JWT authorization access tokens.
* `GET /auth/me` — Resolve active shopper security profile.
* `PATCH /auth/change-password` — Change password.

### Domain 3 & 4: Catalog & Category Taxonomy
* `GET /products` — Paginated catalog listing with multi-parameter filter parameters (`?search=`, `?brand=`, `?category=`, `?minPrice=`, `?maxPrice=`).
* `POST /products` — Create a product listing.
* `GET /products/:productId` — Get individual product specs.
* `PATCH /products/:productId` — Modify a product.
* `DELETE /products/:productId` — Soft-delete a product.
* `GET /categories` — List tax hierarchical divisions.
* `POST /categories` — Insert new taxonomy branch node.
* `GET /categories/:categoryId` — Category detail lookup.
* `PATCH /categories/:categoryId` — Update category branch path.
* `DELETE /categories/:categoryId` — Remove category branch node.

### Domain 5 & 6: Shopper & Merchant Directories
* `GET /customers` — Admin paginated shoppers list.
* `GET /customers/:customerId` — Shopper profile detail.
* `PATCH /customers/:customerId` — Shopper profile edit.
* `DELETE /customers/:customerId` — Shopper profile deactivation.
* `GET /customers/:customerId/orders` — Shopper transaction history logs.
* `GET /sellers` — Active merchants directory.
* `GET /sellers/:sellerId` — Store details.
* `GET /sellers/:sellerId/products` — Store catalog listings.
* `GET /sellers/:sellerId/analytics` — Store performance benchmarks.

### Domain 7 & 8: Transactional Checkout & Inventory
* `POST /orders` — Checkout transaction with atomic stock reservation.
* `GET /orders/my-orders` — Shopper order history logs.
* `GET /orders/:orderId` — Order details.
* `POST /orders/:orderId/pay` — Complete transaction payments.
* `POST /orders/:orderId/cancel` — Cancel order and release stock.
* `GET /orders` — Admin paginated orders list.
* `PATCH /orders/:orderId` — Update order details (tracking, shipping, payment status).
* `PATCH /orders/:orderId/status` — State-machine status transitions (e.g. `SHIPPED`).
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

## ⚡ 6. Deployment & Testing Commands

To boot up the system:

```bash
# Install dependencies
npm install

# Run seeder and JSON-to-CSV Atlas migration script
node src/seed/importDatasetCsv.js

# Launch the live backend server
npm start
```

Your server is now successfully connected to the cloud and running at `http://localhost:5001`! 🎉

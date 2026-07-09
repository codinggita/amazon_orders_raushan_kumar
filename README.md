<div align="center">
  <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop" alt="CartX Platform Hero" width="100%" style="border-radius: 12px; margin-bottom: 20px;" />
  
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
│   │   ├── domain/                             # Core Enterprise Business Rules & MongoDB queries
│   │   ├── infrastructure/                     # Technical Adapters & Database Engines (Redis, Atlas)
│   │   ├── middlewares/                        # Express HTTP Pipeline Middlewares (RBAC, JWT)
│   │   └── seed/                               # Database Ingestion & Seeding adaptation
│   │
├── frontend/                                   # Commerce Analytics & Storefront Client (React/Vite)
│   ├── src/
│   │   ├── components/                         # Reusable UI components (Toast, Modals)
│   │   ├── layouts/                            # Routing Layout wrappers (ShopperLayout, AdminLayout)
│   │   ├── pages/                              # Core screens (Landing, Catalog, Auth, Admin)
│   │   ├── services/                           # Axios API integration layers
│   │   └── store/                              # Zustand global state management
│   └── public/                                 # Static SEO assets (robots.txt, sitemap, manifest)
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
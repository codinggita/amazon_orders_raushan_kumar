import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import env from './configs/env.config.js';
import logger from './infrastructure/logger/index.js';
import { requestTracer } from './middlewares/trace.middleware.js';
import { ApiError } from './utils/apiError.js';
import authRouter from './api/routes/auth.routes.js';
import categoryRouter from './api/routes/category.routes.js';
import productRouter from './api/routes/product.routes.js';
import orderRouter from './api/routes/order.routes.js';
import analyticsRouter from './api/routes/analytics.routes.js';
import healthRouter from './api/routes/health.routes.js';
import customerRouter from './api/routes/customer.routes.js';
import sellerRouter from './api/routes/seller.routes.js';
import inventoryRouter from './api/routes/inventory.routes.js';
import searchRouter from './api/routes/search.routes.js';
import adminRouter from './api/routes/admin.routes.js';

const app = express();

// 0. TRAFFIC CORRELATION & OBSERVABILITY (Execute first)
app.use(requestTracer);

// 1. GLOBAL SECURITY MIDDLEWARES
app.use(helmet()); // Set headers for vulnerability mitigation (XSS, Clickjacking, etc.)
app.use(cors({
  origin: (origin, callback) => {
    callback(null, origin || '*');
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-trace-id'],
  credentials: true,
}));

// 2. REQUEST BODY PARSING & INTEGRITY LIMITS
app.use(express.json({ limit: '10mb' })); // Avoid denial of service (DoS) via massive body payloads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. STRUCTURED TRAFFIC LOGGING (Morgan stream mapped to Winston, decorated with traceId)
morgan.token('trace-id', (req) => req.traceId || 'N/A');
const morganFormat = env.nodeEnv === 'production'
  ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" [TraceID: :trace-id]'
  : ':method :url :status :response-time ms - :res[content-length] [TraceID: :trace-id]';

const morganStream = {
  write: (message) => logger.http(message.trim()),
};
app.use(morgan(morganFormat, { stream: morganStream }));

// 4. CORE BUSINESS DOMAIN ROUTING
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/customers', customerRouter);
app.use('/api/v1/sellers', sellerRouter);
app.use('/api/v1/inventory', inventoryRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/analytics', analyticsRouter);


// 5. GLOBAL DECOUPLED ERROR BOUNDARY MIDDLEWARE
app.use((err, req, res, next) => {
  const traceId = req.traceId || 'N/A';
  
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let message = err.message;
  let errors = err.errors || [];
  
  // Distinguish between handled ApiError and unknown/programmer exceptions
  const isOperational = err instanceof ApiError || err.isOperational;
  
  if (!isOperational) {
    statusCode = 500;
    errorCode = 'INTERNAL_SERVER_ERROR';
    // Protect system privacy: redact raw exception details in production
    if (env.nodeEnv === 'production') {
      message = 'An unexpected internal error occurred on the server.';
    }
  }

  // Log complete error context with unique correlation ID and stack details
  logger.error(`[TraceID: ${traceId}] [Code: ${errorCode}] Exception: ${err.message}`, {
    traceId,
    errorCode,
    statusCode,
    stack: err.stack,
    errors
  });
  
  const errorResponse = {
    success: false,
    message,
    errorCode,
    traceId,
  };
  
  if (errors.length > 0) {
    errorResponse.errors = errors;
  }
  
  // Mask technical stack traces in production environments
  if (env.nodeEnv === 'development') {
    errorResponse.stack = err.stack;
  }
  
  res.status(statusCode).json(errorResponse);
});

export default app;

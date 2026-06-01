import env from '../../configs/env.config.js';
import logger from '../logger/index.js';

// Simple in-memory fallback storage when Redis is unavailable or unconfigured
class InMemoryCache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Check expiration
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttlSeconds = 300) {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
    return true;
  }

  del(key) {
    return this.store.delete(key);
  }

  clear() {
    this.store.clear();
    return true;
  }
}

/**
 * CacheManager abstracts cache management, providing seamless fallback logic
 * for local development setups lacking running Redis nodes.
 */
class CacheManager {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.fallback = new InMemoryCache();
    
    this._initialize();
  }

  async _initialize() {
    // We import dynamically to keep the application boot lightweight and isolate errors
    if (!env.redis.host) {
      logger.warn('Redis host configuration is missing. Falling back to high-performance in-memory cache.');
      return;
    }

    try {
      // Dynamic import check to ensure redis module is present before loading
      const { createClient } = await import('redis');
      
      const redisUrl = env.redis.password
        ? `redis://:${env.redis.password}@${env.redis.host}:${env.redis.port}`
        : `redis://${env.redis.host}:${env.redis.port}`;

      this.client = createClient({ url: redisUrl });

      this.client.on('error', (err) => {
        logger.warn(`Redis client disconnected or error: ${err.message}. Gracefully routing through local in-memory fallback.`);
        this.isReady = false;
      });

      this.client.on('connect', () => {
        logger.info('Connecting to Redis cluster...');
      });

      this.client.on('ready', () => {
        logger.info('Redis cache connection established and active.');
        this.isReady = true;
      });

      // Attempt async connection
      await this.client.connect();

    } catch (err) {
      logger.warn('Failed to load redis npm package. Operating under local in-memory fallback caching.', err.message);
      this.isReady = false;
    }
  }

  /**
   * Fetch cached keys
   */
  async get(key) {
    try {
      if (this.isReady && this.client) {
        const val = await this.client.get(key);
        return val ? JSON.parse(val) : null;
      }
    } catch (error) {
      logger.error(`Cache Read Error: ${error.message}`);
    }
    return this.fallback.get(key);
  }

  /**
   * Set cached values with custom expiration duration
   */
  async set(key, value, ttlSeconds = 300) {
    try {
      if (this.isReady && this.client) {
        await this.client.set(key, JSON.stringify(value), {
          EX: ttlSeconds
        });
        return true;
      }
    } catch (error) {
      logger.error(`Cache Write Error: ${error.message}`);
    }
    return this.fallback.set(key, value, ttlSeconds);
  }

  /**
   * Evict keys from cache
   */
  async del(key) {
    try {
      if (this.isReady && this.client) {
        await this.client.del(key);
        return true;
      }
    } catch (error) {
      logger.error(`Cache Deletion Error: ${error.message}`);
    }
    return this.fallback.del(key);
  }

  /**
   * Express Caching Middleware for GET endpoints
   * @param {number} ttlSeconds - Duration to lock entries in cache
   */
  middleware(ttlSeconds = 300) {
    return async (req, res, next) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Track by original URL request params, separate by user role if required
      const cacheKey = `http_cache:${req.user?.role || 'GUEST'}:${req.originalUrl}`;

      try {
        const cachedPayload = await this.get(cacheKey);
        if (cachedPayload) {
          logger.debug(`[Cache HIT] Serving page directly from store: ${cacheKey}`);
          // Send cached headers
          res.setHeader('x-cache-status', 'HIT');
          return res.status(200).json(cachedPayload);
        }
      } catch (err) {
        logger.error(`Cache middleware check failed: ${err.message}`);
      }

      res.setHeader('x-cache-status', 'MISS');

      // Intercept the res.json method to store payload before flushing to connection
      const originalJson = res.json;
      res.json = (body) => {
        // Cache only successful REST responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.set(cacheKey, body, ttlSeconds).catch((err) => {
            logger.error(`Failed to cache response for ${cacheKey}: ${err.message}`);
          });
        }
        res.json = originalJson;
        return res.json(body);
      };

      next();
    };
  }
}

const cache = new CacheManager();

export default cache;
export { cache };

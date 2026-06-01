import mongoose from 'mongoose';
import env from '../../configs/env.config.js';
import logger from '../logger/index.js';

const MONGO_RETRY_LIMIT = 5;
const MONGO_RETRY_INTERVAL_MS = 5000;
let connectionRetryCount = 0;

const mongooseOptions = {
  autoIndex: env.nodeEnv === 'development', // Build indexes in dev; production builds should do this out-of-band
  serverSelectionTimeoutMS: 5000,          // Time out after 5s instead of hanging
  socketTimeoutMS: 45000,                  // Close sockets after 45s of inactivity
  maxPoolSize: 10,                         // Maintain up to 10 socket connections in pool
};

/**
 * Connect to MongoDB with retry logic
 */
export const connectDatabase = async () => {
  logger.info('Initializing connection to MongoDB...');
  
  try {
    await mongoose.connect(env.mongodbUri, mongooseOptions);
    connectionRetryCount = 0; // Reset count upon successful connection
  } catch (error) {
    connectionRetryCount++;
    logger.error(`MongoDB connection failed (Attempt ${connectionRetryCount}/${MONGO_RETRY_LIMIT}): ${error.message}`);
    
    if (connectionRetryCount >= MONGO_RETRY_LIMIT) {
      logger.error('CRITICAL: MongoDB connection retry limit exceeded. Initiating immediate server shutdown...');
      process.exit(1);
    }
    
    logger.info(`Retrying MongoDB connection in ${MONGO_RETRY_INTERVAL_MS / 1000}s...`);
    setTimeout(connectDatabase, MONGO_RETRY_INTERVAL_MS);
  }
};

// Lifecycle Event Listeners
mongoose.connection.on('connected', () => {
  logger.info('MongoDB connection successfully established and active.');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB runtime connection error encountered: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection lost. Attempting automatic recovery...');
});

// Graceful Shutdown Handler
export const closeDatabaseConnection = async () => {
  if (mongoose.connection.readyState === 0) {
    return;
  }
  
  logger.info('Initiating graceful shutdown of MongoDB connection pool...');
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection pool successfully closed.');
  } catch (error) {
    logger.error(`Error occurred while closing MongoDB connection pool: ${error.message}`);
  }
};

export default connectDatabase;

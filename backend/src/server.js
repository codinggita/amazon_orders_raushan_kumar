import app from './app.js';
import env from './configs/env.config.js';
import logger from './infrastructure/logger/index.js';
import { connectDatabase, closeDatabaseConnection } from './infrastructure/database/index.js';

let server;

/**
 * Bootstrap Commerce Intelligence Backend Application
 */
const bootstrap = async () => {
  try {
    // 1. Establish database connection pool
    await connectDatabase();

    // 2. Start Express HTTP Server
    server = app.listen(env.port, () => {
      logger.info('====================================================');
      logger.info('  COMMERCE INTELLIGENCE BACKEND IS ONLINE');
      logger.info(`  Environment : ${env.nodeEnv.toUpperCase()}`);
      logger.info(`  Port        : ${env.port}`);
      logger.info(`  Process ID  : ${process.pid}`);
      logger.info('====================================================');
    });
  } catch (error) {
    logger.error('CRITICAL FAILED TO BOOTSTRAP BACKEND ENGINE:', error);
    process.exit(1);
  }
};

// Initiate application startup
bootstrap();

/**
 * Handle graceful teardown of resources
 */
const initiateGracefulShutdown = (signal) => {
  logger.warn(`Teardown initiated. OS Signal: ${signal}`);
  
  if (server) {
    logger.info('Halting Express HTTP listener (no longer accepting new requests)...');
    
    server.close(async () => {
      logger.info('Express HTTP server successfully closed.');
      
      // Drain database pool
      await closeDatabaseConnection();
      
      logger.info('Teardown finished. Clean exit achieved.');
      process.exit(0);
    });
    
    // Safety timeout to force exit if graceful close hangs
    setTimeout(() => {
      logger.error('Teardown timed out. Forcing process exit...');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

// Process-level Crash Listeners
process.on('uncaughtException', (error) => {
  logger.error('CRITICAL: Uncaught Exception caught at process level!', error);
  initiateGracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason) => {
  logger.error('CRITICAL: Unhandled Promise Rejection caught at process level!', reason instanceof Error ? reason : new Error(String(reason)));
  initiateGracefulShutdown('UNHANDLED_REJECTION');
});

// OS signal listeners
process.on('SIGTERM', () => {
  initiateGracefulShutdown('SIGTERM');
});

process.on('SIGINT', () => {
  initiateGracefulShutdown('SIGINT');
});

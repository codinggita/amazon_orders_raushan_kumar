import winston from 'winston';
import env from '../../configs/env.config.js';

// Define custom log levels (RFC 5424)
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for console output in development
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan',
};

// Link colors to Winston levels
winston.addColors(colors);

// Define log level based on environment
const level = () => {
  return env.logging.level || (env.nodeEnv === 'development' ? 'debug' : 'info');
};

// Formatter to handle Error objects stack traces
const errorStackFormat = winston.format((info) => {
  if (info instanceof Error) {
    return Object.assign({}, info, {
      message: info.message,
      stack: info.stack,
    });
  }
  return info;
});

// Structured JSON format for production environments
const productionFormat = winston.format.combine(
  errorStackFormat(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.json()
);

// Colorized human-readable format for development environments
const developmentFormat = winston.format.combine(
  errorStackFormat(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level}]: ${info.message}${info.stack ? `\nStack Trace:\n${info.stack}` : ''}`
  )
);

// Create Winston Logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format: env.nodeEnv === 'production' ? productionFormat : developmentFormat,
  transports: [
    new winston.transports.Console()
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

export default logger;

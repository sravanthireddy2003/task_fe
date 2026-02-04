/**
 * Centralized logger utility for production-safe logging
 * Environment-aware: verbose in development, minimal in production
 */

const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development';
const isTest = import.meta.env.VITE_ENVIRONMENT === 'test';

// Log levels
const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

// Color helpers for development console
const colors = {
  reset: '\x1b[0m',
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
};

/**
 * Format log message with context
 * @param {string} level - Log level (debug, info, warn, error)
 * @param {string} context - Component or module name
 * @param {string} message - Log message
 * @param {*} data - Optional data to log
 */
function formatMessage(level, context, message, data) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${context}] ${message}`;
  
  if (isDev && !isTest) {
    const color = colors[level] || colors.reset;
    return `${color}${prefix}${colors.reset}`;
  }
  return prefix;
}

/**
 * Check if sensitive data exists in payload
 * @param {*} data - Data to check
 * @returns {boolean}
 */
function containsSensitiveData(data) {
  if (!data) return false;
  
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'refreshToken', 'accessToken'];
  const dataStr = JSON.stringify(data).toLowerCase();
  
  return sensitiveKeys.some(key => dataStr.includes(key.toLowerCase()));
}

/**
 * Sanitize sensitive data from logs
 * @param {*} data - Data to sanitize
 * @returns {*}
 */
function sanitize(data) {
  if (!data) return data;
  
  if (typeof data !== 'object') return data;
  
  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'refreshToken', 'accessToken'];
  
  const replaceSensitive = (obj) => {
    for (const key in obj) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        replaceSensitive(obj[key]);
      }
    }
  };
  
  replaceSensitive(sanitized);
  return sanitized;
}

export const logger = {
  /**
   * Debug level logging (dev only)
   * @param {string} context - Component/module name
   * @param {string} message - Log message
   * @param {*} data - Optional data
   */
  debug(context, message, data) {
    if (!isDev || isTest) return;
    const formatted = formatMessage(LOG_LEVELS.DEBUG, context, message);
    if (data) {
      console.debug(formatted, containsSensitiveData(data) ? sanitize(data) : data);
    } else {
      console.debug(formatted);
    }
  },

  /**
   * Info level logging
   * @param {string} context - Component/module name
   * @param {string} message - Log message
   * @param {*} data - Optional data
   */
  info(context, message, data) {
    if (isTest) return;
    const formatted = formatMessage(LOG_LEVELS.INFO, context, message);
    if (data) {
      console.info(formatted, containsSensitiveData(data) ? sanitize(data) : data);
    } else {
      console.info(formatted);
    }
  },

  /**
   * Warning level logging
   * @param {string} context - Component/module name
   * @param {string} message - Log message
   * @param {*} data - Optional data
   */
  warn(context, message, data) {
    if (isTest) return;
    const formatted = formatMessage(LOG_LEVELS.WARN, context, message);
    if (data) {
      console.warn(formatted, containsSensitiveData(data) ? sanitize(data) : data);
    } else {
      console.warn(formatted);
    }
  },

  /**
   * Error level logging (always enabled)
   * @param {string} context - Component/module name
   * @param {string} message - Log message
   * @param {*} data - Optional data
   */
  error(context, message, data) {
    const formatted = formatMessage(LOG_LEVELS.ERROR, context, message);
    if (data) {
      console.error(formatted, containsSensitiveData(data) ? sanitize(data) : data);
    } else {
      console.error(formatted);
    }
  },
};

export default logger;

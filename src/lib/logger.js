/**
 * LOW PRIORITY P4 Issue #37 - Structured Logging System
 *
 * Centralized logging utility with structured context and log levels.
 * Designed to integrate with error tracking services (Sentry, LogRocket, etc.)
 *
 * Features:
 * - Structured log entries with metadata
 * - Log levels: debug, info, warn, error
 * - User and session context
 * - Component/module tracking
 * - Performance measurement
 * - Error tracking integration ready
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  constructor() {
    this.currentLevel = import.meta.env.PROD ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;
    this.context = {};
    this.errorTracker = null; // For future Sentry/LogRocket integration
  }

  /**
   * Set global context (user info, session, etc.)
   */
  setContext(context) {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear specific context keys
   */
  clearContext(keys = []) {
    if (keys.length === 0) {
      this.context = {};
    } else {
      keys.forEach(key => delete this.context[key]);
    }
  }

  /**
   * Set error tracking service (Sentry, LogRocket, etc.)
   */
  setErrorTracker(tracker) {
    this.errorTracker = tracker;
  }

  /**
   * Internal log method
   */
  _log(level, message, data = {}, error = null) {
    if (level < this.currentLevel) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: Object.keys(LOG_LEVELS)[level],
      message,
      context: { ...this.context },
      data,
      ...(error && { error: this._serializeError(error) }),
    };

    // Console output with appropriate method
    const consoleMethod = {
      [LOG_LEVELS.DEBUG]: 'debug',
      [LOG_LEVELS.INFO]: 'info',
      [LOG_LEVELS.WARN]: 'warn',
      [LOG_LEVELS.ERROR]: 'error',
    }[level];

    if (import.meta.env.DEV) {
      // Pretty print in development
      console[consoleMethod](
        `[${logEntry.level}] ${logEntry.message}`,
        logEntry.data,
        logEntry.context
      );
      if (error) console[consoleMethod](error);
    } else {
      // Structured JSON in production
      console[consoleMethod](JSON.stringify(logEntry));
    }

    // Send to error tracking service
    if (this.errorTracker && level >= LOG_LEVELS.WARN) {
      this._sendToTracker(logEntry);
    }

    return logEntry;
  }

  /**
   * Serialize error objects
   */
  _serializeError(error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error.cause && { cause: this._serializeError(error.cause) }),
    };
  }

  /**
   * Send to external error tracker
   */
  _sendToTracker(logEntry) {
    if (!this.errorTracker) return;

    try {
      // Example integration (uncomment when service is configured)
      // if (logEntry.level === 'ERROR') {
      //   this.errorTracker.captureException(logEntry.error, {
      //     level: 'error',
      //     contexts: {
      //       custom: logEntry.context,
      //       data: logEntry.data,
      //     },
      //   });
      // } else if (logEntry.level === 'WARN') {
      //   this.errorTracker.captureMessage(logEntry.message, {
      //     level: 'warning',
      //     contexts: {
      //       custom: logEntry.context,
      //       data: logEntry.data,
      //     },
      //   });
      // }
    } catch (err) {
      console.error('Failed to send to error tracker:', err);
    }
  }

  /**
   * Debug level logging
   */
  debug(message, data = {}) {
    return this._log(LOG_LEVELS.DEBUG, message, data);
  }

  /**
   * Info level logging
   */
  info(message, data = {}) {
    return this._log(LOG_LEVELS.INFO, message, data);
  }

  /**
   * Warning level logging
   */
  warn(message, data = {}) {
    return this._log(LOG_LEVELS.WARN, message, data);
  }

  /**
   * Error level logging
   */
  error(message, data = {}, error = null) {
    return this._log(LOG_LEVELS.ERROR, message, data, error);
  }

  /**
   * Create a child logger with module context
   */
  module(moduleName) {
    const moduleLogger = {
      debug: (msg, data) => this.debug(msg, { ...data, module: moduleName }),
      info: (msg, data) => this.info(msg, { ...data, module: moduleName }),
      warn: (msg, data) => this.warn(msg, { ...data, module: moduleName }),
      error: (msg, data, err) => this.error(msg, { ...data, module: moduleName }, err),
      time: (label) => this.time(`${moduleName}:${label}`),
      timeEnd: (label) => this.timeEnd(`${moduleName}:${label}`),
    };
    return moduleLogger;
  }

  /**
   * Performance measurement
   */
  time(label) {
    if (import.meta.env.DEV) {
      console.time(label);
    }
    this._timers = this._timers || {};
    this._timers[label] = performance.now();
  }

  /**
   * End performance measurement
   */
  timeEnd(label) {
    if (!this._timers || !this._timers[label]) {
      this.warn('Timer not found', { label });
      return;
    }

    const duration = performance.now() - this._timers[label];
    delete this._timers[label];

    if (import.meta.env.DEV) {
      console.timeEnd(label);
    }

    this.debug('Performance measurement', {
      label,
      duration: `${duration.toFixed(2)}ms`,
    });

    return duration;
  }

  /**
   * Log API request
   */
  apiRequest(method, url, data = {}) {
    this.debug('API Request', {
      method,
      url,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Log API response
   */
  apiResponse(method, url, status, duration, data = {}) {
    const level = status >= 400 ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG;
    this._log(level, 'API Response', {
      method,
      url,
      status,
      duration: `${duration}ms`,
      data,
    });
  }

  /**
   * Log user action
   */
  userAction(action, data = {}) {
    return this.info('User Action', {
      action,
      ...data,
    });
  }

  /**
   * Log navigation
   */
  navigation(from, to) {
    return this.debug('Navigation', { from, to });
  }
}

// Create singleton instance
const logger = new Logger();

// Export singleton and class
export default logger;
export { Logger, LOG_LEVELS };

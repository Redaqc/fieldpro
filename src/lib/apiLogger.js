/**
 * LOW PRIORITY P4 Issue #37 - API Request/Response Logging
 *
 * Utility to log all API requests and responses for debugging and monitoring
 * Can be integrated with fetch or React Query
 */

import logger from './logger';

/**
 * Log API request details
 */
export function logApiRequest(method, url, options = {}) {
  logger.apiRequest(method, url, {
    headers: options.headers,
    body: options.body,
    params: options.params,
  });
}

/**
 * Log API response details
 */
export function logApiResponse(method, url, status, duration, data = {}) {
  logger.apiResponse(method, url, status, duration, {
    responseSize: JSON.stringify(data).length,
    success: status >= 200 && status < 300,
  });
}

/**
 * Wrapper for fetch that adds logging
 *
 * Usage:
 *   const response = await loggedFetch('/api/jobs', { method: 'GET' });
 */
export async function loggedFetch(url, options = {}) {
  const method = options.method || 'GET';
  const startTime = performance.now();

  logApiRequest(method, url, options);

  try {
    const response = await fetch(url, options);
    const duration = Math.round(performance.now() - startTime);

    logApiResponse(method, url, response.status, duration);

    return response;
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);

    logger.error(
      'API Request Failed',
      {
        method,
        url,
        duration: `${duration}ms`,
        errorMessage: error.message,
      },
      error
    );

    throw error;
  }
}

/**
 * React Query logger integration
 * Add this to your QueryClient configuration
 */
export const queryClientLogger = {
  onError: (error, query) => {
    logger.error(
      'React Query Error',
      {
        queryKey: query.queryKey,
        errorMessage: error.message,
      },
      error
    );
  },
  onSuccess: (data, query) => {
    if (import.meta.env.DEV) {
      logger.debug('React Query Success', {
        queryKey: query.queryKey,
        dataSize: JSON.stringify(data).length,
      });
    }
  },
};

/**
 * Base44 SDK logger wrapper
 * Wraps Base44 operations to add logging
 */
export function createBase44Logger(base44Client) {
  return new Proxy(base44Client, {
    get(target, prop) {
      const original = target[prop];

      if (typeof original === 'function') {
        return function(...args) {
          const startTime = performance.now();
          logger.debug('Base44 Operation', {
            operation: prop,
            args: args.slice(0, 2), // Log first 2 args only
          });

          const result = original.apply(target, args);

          // If it's a promise, log the result
          if (result instanceof Promise) {
            return result
              .then(data => {
                const duration = Math.round(performance.now() - startTime);
                logger.debug('Base44 Operation Success', {
                  operation: prop,
                  duration: `${duration}ms`,
                });
                return data;
              })
              .catch(error => {
                const duration = Math.round(performance.now() - startTime);
                logger.error(
                  'Base44 Operation Failed',
                  {
                    operation: prop,
                    duration: `${duration}ms`,
                  },
                  error
                );
                throw error;
              });
          }

          return result;
        };
      }

      return original;
    },
  });
}

export default {
  logApiRequest,
  logApiResponse,
  loggedFetch,
  queryClientLogger,
  createBase44Logger,
};

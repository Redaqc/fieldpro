import { useEffect, useMemo, useCallback } from 'react';
import logger from '@/lib/logger';

/**
 * LOW PRIORITY P4 Issue #37 - React Hook for Structured Logging
 *
 * Hook to use the logger in React components with automatic module context
 *
 * Usage:
 *   const log = useLogger('JobList');
 *   log.info('Jobs loaded', { count: jobs.length });
 *   log.error('Failed to load jobs', { error: err.message }, err);
 */
export function useLogger(componentName) {
  // Create module-specific logger
  const log = useMemo(() => {
    return logger.module(componentName);
  }, [componentName]);

  // Log component mount/unmount in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      log.debug(`Component mounted`);
      return () => {
        log.debug(`Component unmounted`);
      };
    }
  }, [log]);

  return log;
}

/**
 * Hook to track performance of effects or operations
 *
 * Usage:
 *   const measurePerformance = usePerformanceLogger('DataFetch');
 *
 *   useEffect(() => {
 *     const end = measurePerformance('fetch-jobs');
 *     fetchJobs().finally(end);
 *   }, []);
 */
export function usePerformanceLogger(componentName) {
  const log = useLogger(componentName);

  const measure = useCallback((label) => {
    const fullLabel = `${componentName}:${label}`;
    logger.time(fullLabel);

    return () => {
      logger.timeEnd(fullLabel);
    };
  }, [componentName]);

  return measure;
}

/**
 * Hook to log user actions
 *
 * Usage:
 *   const logAction = useActionLogger('JobForm');
 *   <button onClick={() => logAction('submit', { jobId })}>Submit</button>
 */
export function useActionLogger(componentName) {
  const log = useLogger(componentName);

  const logAction = useCallback((action, data = {}) => {
    log.info(`User action: ${action}`, data);
  }, [log]);

  return logAction;
}

export default useLogger;

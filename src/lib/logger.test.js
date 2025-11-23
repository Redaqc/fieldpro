/**
 * LOW PRIORITY P4 Issue #43 - Unit Tests
 * Tests for the structured logging system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import logger, { Logger, LOG_LEVELS } from './logger';

describe('Logger', () => {
  let testLogger;
  let consoleDebugSpy;
  let consoleInfoSpy;
  let consoleWarnSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    testLogger = new Logger();
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleDebugSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Basic logging', () => {
    it('should log debug messages', () => {
      const result = testLogger.debug('Test debug', { foo: 'bar' });

      expect(result).toBeDefined();
      expect(result.level).toBe('DEBUG');
      expect(result.message).toBe('Test debug');
      expect(result.data).toEqual({ foo: 'bar' });
    });

    it('should log info messages', () => {
      const result = testLogger.info('Test info', { foo: 'bar' });

      expect(result).toBeDefined();
      expect(result.level).toBe('INFO');
      expect(result.message).toBe('Test info');
    });

    it('should log warn messages', () => {
      const result = testLogger.warn('Test warn', { foo: 'bar' });

      expect(result).toBeDefined();
      expect(result.level).toBe('WARN');
      expect(result.message).toBe('Test warn');
    });

    it('should log error messages', () => {
      const error = new Error('Test error');
      const result = testLogger.error('Test error', { foo: 'bar' }, error);

      expect(result).toBeDefined();
      expect(result.level).toBe('ERROR');
      expect(result.message).toBe('Test error');
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Test error');
    });
  });

  describe('Context management', () => {
    it('should set global context', () => {
      testLogger.setContext({ userId: '123', sessionId: 'abc' });
      const result = testLogger.info('Test with context');

      expect(result.context).toEqual({ userId: '123', sessionId: 'abc' });
    });

    it('should merge context', () => {
      testLogger.setContext({ userId: '123' });
      testLogger.setContext({ sessionId: 'abc' });
      const result = testLogger.info('Test');

      expect(result.context).toEqual({ userId: '123', sessionId: 'abc' });
    });

    it('should clear specific context keys', () => {
      testLogger.setContext({ userId: '123', sessionId: 'abc', token: 'xyz' });
      testLogger.clearContext(['token']);
      const result = testLogger.info('Test');

      expect(result.context).toEqual({ userId: '123', sessionId: 'abc' });
      expect(result.context.token).toBeUndefined();
    });

    it('should clear all context', () => {
      testLogger.setContext({ userId: '123', sessionId: 'abc' });
      testLogger.clearContext();
      const result = testLogger.info('Test');

      expect(result.context).toEqual({});
    });
  });

  describe('Module logger', () => {
    it('should create module-specific logger', () => {
      const moduleLogger = testLogger.module('JobList');
      const result = moduleLogger.info('Test', { count: 5 });

      expect(result.data.module).toBe('JobList');
      expect(result.data.count).toBe(5);
    });

    it('should include module in all log levels', () => {
      const moduleLogger = testLogger.module('TestModule');

      const debugResult = moduleLogger.debug('Debug');
      const infoResult = moduleLogger.info('Info');
      const warnResult = moduleLogger.warn('Warn');
      const errorResult = moduleLogger.error('Error', {}, new Error());

      expect(debugResult.data.module).toBe('TestModule');
      expect(infoResult.data.module).toBe('TestModule');
      expect(warnResult.data.module).toBe('TestModule');
      expect(errorResult.data.module).toBe('TestModule');
    });
  });

  describe('Performance measurement', () => {
    it('should measure time', () => {
      testLogger.time('test-operation');
      const duration = testLogger.timeEnd('test-operation');

      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle nested timers', () => {
      testLogger.time('outer');
      testLogger.time('inner');

      const innerDuration = testLogger.timeEnd('inner');
      const outerDuration = testLogger.timeEnd('outer');

      expect(innerDuration).toBeGreaterThanOrEqual(0);
      expect(outerDuration).toBeGreaterThanOrEqual(innerDuration);
    });

    it('should warn on missing timer', () => {
      testLogger.timeEnd('non-existent');

      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('API logging', () => {
    it('should log API request', () => {
      testLogger.apiRequest('GET', '/api/jobs', { id: 123 });

      expect(consoleDebugSpy).toHaveBeenCalled();
    });

    it('should log API response', () => {
      testLogger.apiResponse('GET', '/api/jobs', 200, 150);

      expect(consoleDebugSpy).toHaveBeenCalled();
    });

    it('should log API error as error level', () => {
      testLogger.apiResponse('POST', '/api/jobs', 500, 150);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('User action logging', () => {
    it('should log user action', () => {
      const result = testLogger.userAction('click-submit', { formId: 'job-form' });

      expect(result.level).toBe('INFO');
      expect(result.data.action).toBe('click-submit');
      expect(result.data.formId).toBe('job-form');
    });
  });

  describe('Navigation logging', () => {
    it('should log navigation', () => {
      const result = testLogger.navigation('/jobs', '/jobs/123');

      expect(result.level).toBe('DEBUG');
      expect(result.data.from).toBe('/jobs');
      expect(result.data.to).toBe('/jobs/123');
    });
  });

  describe('Error serialization', () => {
    it('should serialize error objects', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      const result = testLogger.error('Error occurred', {}, error);

      expect(result.error.name).toBe('Error');
      expect(result.error.message).toBe('Test error');
      expect(result.error.stack).toBeDefined();
    });

    it('should serialize nested errors', () => {
      const cause = new Error('Original error');
      const error = new Error('Wrapped error');
      error.cause = cause;

      const result = testLogger.error('Nested error', {}, error);

      expect(result.error.cause).toBeDefined();
      expect(result.error.cause.message).toBe('Original error');
    });
  });

  describe('Log levels', () => {
    it('should respect log level in production', () => {
      const prodLogger = new Logger();
      prodLogger.currentLevel = LOG_LEVELS.INFO;

      prodLogger.debug('This should not log');
      prodLogger.info('This should log');

      // Debug should not be called
      const debugCalls = consoleDebugSpy.mock.calls.filter(
        call => call[0]?.includes('This should not log')
      );
      expect(debugCalls.length).toBe(0);
    });
  });

  describe('Timestamp', () => {
    it('should include timestamp in log entry', () => {
      const before = new Date().toISOString();
      const result = testLogger.info('Test');
      const after = new Date().toISOString();

      expect(result.timestamp).toBeDefined();
      expect(result.timestamp >= before).toBe(true);
      expect(result.timestamp <= after).toBe(true);
    });
  });
});

describe('Singleton logger', () => {
  it('should export singleton instance', () => {
    expect(logger).toBeDefined();
    expect(logger.debug).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.error).toBeDefined();
  });

  it('should maintain context across calls', () => {
    logger.setContext({ test: 'singleton' });
    const result = logger.info('Test singleton');

    expect(result.context.test).toBe('singleton');

    // Clean up
    logger.clearContext();
  });
});

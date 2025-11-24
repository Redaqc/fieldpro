/**
 * LOW PRIORITY P4 Issue #43 - Unit Tests
 * Tests for useSequentialNumber hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSequentialNumber } from './useSequentialNumber';

// Mock the base44 client
vi.mock('@/api/base44Client', () => ({
  base44: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { base44 } from '@/api/base44Client';

describe('useSequentialNumber', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
    console.warn.mockRestore();
  });

  it('should generate invoice number', async () => {
    base44.functions.invoke.mockResolvedValue({
      data: { number: 'INV-2025-0001' },
    });

    const { result } = renderHook(() => useSequentialNumber());
    const number = await result.current('invoice');

    expect(number).toBe('INV-2025-0001');
    expect(base44.functions.invoke).toHaveBeenCalledWith('generateSequentialNumber', {
      type: 'invoice',
      prefix: null,
    });
  });

  it('should generate quotation number', async () => {
    base44.functions.invoke.mockResolvedValue({
      data: { number: 'QUO-2025-0015' },
    });

    const { result } = renderHook(() => useSequentialNumber());
    const number = await result.current('quotation');

    expect(number).toBe('QUO-2025-0015');
  });

  it('should use custom prefix', async () => {
    base44.functions.invoke.mockResolvedValue({
      data: { number: 'CUSTOM-2025-0001' },
    });

    const { result } = renderHook(() => useSequentialNumber());
    const number = await result.current('job', 'CUSTOM');

    expect(number).toBe('CUSTOM-2025-0001');
    expect(base44.functions.invoke).toHaveBeenCalledWith('generateSequentialNumber', {
      type: 'job',
      prefix: 'CUSTOM',
    });
  });

  it('should handle backend errors with fallback', async () => {
    base44.functions.invoke.mockRejectedValue(new Error('Backend error'));

    const { result } = renderHook(() => useSequentialNumber());
    const number = await result.current('invoice');

    // Should return fallback number with timestamp
    expect(number).toMatch(/^INVOICE-\d+$/);
    expect(console.error).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });

  it('should use custom prefix in fallback', async () => {
    base44.functions.invoke.mockRejectedValue(new Error('Backend error'));

    const { result } = renderHook(() => useSequentialNumber());
    const number = await result.current('job', 'PROJECT');

    expect(number).toMatch(/^PROJECT-\d+$/);
  });

  it('should generate different numbers for different types', async () => {
    base44.functions.invoke
      .mockResolvedValueOnce({ data: { number: 'INV-2025-0001' } })
      .mockResolvedValueOnce({ data: { number: 'JOB-2025-0001' } });

    const { result } = renderHook(() => useSequentialNumber());

    const invoiceNumber = await result.current('invoice');
    const jobNumber = await result.current('job');

    expect(invoiceNumber).toBe('INV-2025-0001');
    expect(jobNumber).toBe('JOB-2025-0001');
  });

  it('should be reusable across multiple calls', async () => {
    base44.functions.invoke
      .mockResolvedValueOnce({ data: { number: 'INV-2025-0001' } })
      .mockResolvedValueOnce({ data: { number: 'INV-2025-0002' } })
      .mockResolvedValueOnce({ data: { number: 'INV-2025-0003' } });

    const { result } = renderHook(() => useSequentialNumber());

    const num1 = await result.current('invoice');
    const num2 = await result.current('invoice');
    const num3 = await result.current('invoice');

    expect(num1).toBe('INV-2025-0001');
    expect(num2).toBe('INV-2025-0002');
    expect(num3).toBe('INV-2025-0003');
    expect(base44.functions.invoke).toHaveBeenCalledTimes(3);
  });
});

/**
 * LOW PRIORITY P4 Issue #43 - Unit Tests
 * Tests for usePagination hook and getPaginationRange utility
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination, getPaginationRange } from './usePagination';

describe('usePagination', () => {
  const mockData = Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));

  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(5);
    expect(result.current.totalItems).toBe(50);
    expect(result.current.itemsPerPage).toBe(10);
    expect(result.current.currentData).toHaveLength(10);
  });

  it('should return correct page data', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    expect(result.current.currentData[0]).toEqual({ id: 1, name: 'Item 1' });
    expect(result.current.currentData[9]).toEqual({ id: 10, name: 'Item 10' });
  });

  it('should navigate to next page', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.currentData[0]).toEqual({ id: 11, name: 'Item 11' });
    expect(result.current.currentData[9]).toEqual({ id: 20, name: 'Item 20' });
  });

  it('should navigate to previous page', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    act(() => {
      result.current.goToPage(3);
    });

    expect(result.current.currentPage).toBe(3);

    act(() => {
      result.current.previousPage();
    });

    expect(result.current.currentPage).toBe(2);
  });

  it('should jump to specific page', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    act(() => {
      result.current.goToPage(4);
    });

    expect(result.current.currentPage).toBe(4);
    expect(result.current.currentData[0]).toEqual({ id: 31, name: 'Item 31' });
  });

  it('should navigate to first page', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    act(() => {
      result.current.goToPage(5);
      result.current.goToFirstPage();
    });

    expect(result.current.currentPage).toBe(1);
  });

  it('should navigate to last page', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    act(() => {
      result.current.goToLastPage();
    });

    expect(result.current.currentPage).toBe(5);
    expect(result.current.currentData).toHaveLength(10);
  });

  it('should not go beyond first page', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    act(() => {
      result.current.previousPage();
    });

    expect(result.current.currentPage).toBe(1);
  });

  it('should not go beyond last page', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    act(() => {
      result.current.goToLastPage();
    });

    expect(result.current.currentPage).toBe(5);

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(5);
  });

  it('should calculate correct page range', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    expect(result.current.pageRange).toEqual({ start: 1, end: 10 });

    act(() => {
      result.current.goToPage(2);
    });

    expect(result.current.pageRange).toEqual({ start: 11, end: 20 });
  });

  it('should handle empty data', () => {
    const { result } = renderHook(() => usePagination([], 10));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(0);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.currentData).toHaveLength(0);
    expect(result.current.pageRange).toEqual({ start: 0, end: 0 });
  });

  it('should handle partial last page', () => {
    const partialData = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
    const { result } = renderHook(() => usePagination(partialData, 10));

    act(() => {
      result.current.goToLastPage();
    });

    expect(result.current.currentPage).toBe(3);
    expect(result.current.currentData).toHaveLength(5); // Only 5 items on last page
  });

  it('should reset pagination', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    act(() => {
      result.current.goToPage(3);
      result.current.resetPagination();
    });

    expect(result.current.currentPage).toBe(1);
  });

  it('should correctly report navigation state', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    // First page
    expect(result.current.canGoPrevious).toBe(false);
    expect(result.current.canGoNext).toBe(true);
    expect(result.current.isFirstPage).toBe(true);
    expect(result.current.isLastPage).toBe(false);

    // Middle page
    act(() => {
      result.current.goToPage(3);
    });

    expect(result.current.canGoPrevious).toBe(true);
    expect(result.current.canGoNext).toBe(true);
    expect(result.current.isFirstPage).toBe(false);
    expect(result.current.isLastPage).toBe(false);

    // Last page
    act(() => {
      result.current.goToLastPage();
    });

    expect(result.current.canGoPrevious).toBe(true);
    expect(result.current.canGoNext).toBe(false);
    expect(result.current.isFirstPage).toBe(false);
    expect(result.current.isLastPage).toBe(true);
  });
});

describe('getPaginationRange', () => {
  it('should show all pages when total is 7 or less', () => {
    expect(getPaginationRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPaginationRange(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('should show dots when there are many pages', () => {
    const range = getPaginationRange(1, 10);
    expect(range).toContain('...');
    expect(range[0]).toBe(1);
    expect(range[range.length - 1]).toBe(10);
  });

  it('should show pages around current page', () => {
    const range = getPaginationRange(5, 10, 1);
    expect(range).toContain(4); // Left sibling
    expect(range).toContain(5); // Current
    expect(range).toContain(6); // Right sibling
  });

  it('should not show left dots when close to start', () => {
    const range = getPaginationRange(2, 10);
    expect(range[1]).not.toBe('...');
  });

  it('should not show right dots when close to end', () => {
    const range = getPaginationRange(9, 10);
    const secondLast = range[range.length - 2];
    expect(secondLast).not.toBe('...');
  });

  it('should show both dots when in middle', () => {
    const range = getPaginationRange(5, 10);
    expect(range.filter(x => x === '...')).toHaveLength(2);
  });

  it('should respect siblingCount parameter', () => {
    const range1 = getPaginationRange(5, 20, 1);
    const range2 = getPaginationRange(5, 20, 2);

    // With siblingCount=2, should have more page numbers
    expect(range2.length).toBeGreaterThan(range1.length);
  });
});

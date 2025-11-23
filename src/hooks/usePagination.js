import { useMemo, useState } from 'react';

/**
 * LOW PRIORITY P4 Issue #38 - Pagination Hook
 *
 * Custom hook for managing pagination state and calculations
 *
 * @param {Array} data - The full dataset to paginate
 * @param {number} itemsPerPage - Number of items per page (default: 10)
 * @returns {Object} Pagination state and helpers
 */
export function usePagination(data = [], itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination values
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Ensure current page is valid
  const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));

  // Calculate start and end indices
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Get current page data
  const currentData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  // Navigation functions
  const goToPage = (page) => {
    const pageNum = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNum);
  };

  const nextPage = () => {
    if (validCurrentPage < totalPages) {
      setCurrentPage(validCurrentPage + 1);
    }
  };

  const previousPage = () => {
    if (validCurrentPage > 1) {
      setCurrentPage(validCurrentPage - 1);
    }
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);

  // Check if navigation is possible
  const canGoNext = validCurrentPage < totalPages;
  const canGoPrevious = validCurrentPage > 1;

  // Get page range for display (e.g., "Showing 1-10 of 100")
  const getPageRange = () => {
    if (totalItems === 0) return { start: 0, end: 0 };
    return {
      start: startIndex + 1,
      end: endIndex
    };
  };

  // Reset to first page (useful when data changes)
  const resetPagination = () => setCurrentPage(1);

  return {
    // Current page data
    currentData,

    // Pagination state
    currentPage: validCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage,

    // Page range
    pageRange: getPageRange(),

    // Navigation functions
    goToPage,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    resetPagination,

    // Navigation state
    canGoNext,
    canGoPrevious,

    // Helpers
    hasMultiplePages: totalPages > 1,
    isFirstPage: validCurrentPage === 1,
    isLastPage: validCurrentPage === totalPages,
  };
}

/**
 * Get page numbers array for pagination UI
 * Shows first, last, and pages around current page
 *
 * @param {number} currentPage
 * @param {number} totalPages
 * @param {number} siblingCount - Number of pages to show on each side of current
 * @returns {Array} Array of page numbers or '...' for gaps
 */
export function getPaginationRange(currentPage, totalPages, siblingCount = 1) {
  if (totalPages <= 7) {
    // Show all pages if total is 7 or less
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

  const range = [];

  // Always show first page
  range.push(1);

  // Show left dots if needed
  if (shouldShowLeftDots) {
    range.push('...');
  }

  // Show pages around current page
  for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
    if (i !== 1 && i !== totalPages) {
      range.push(i);
    }
  }

  // Show right dots if needed
  if (shouldShowRightDots) {
    range.push('...');
  }

  // Always show last page
  if (totalPages > 1) {
    range.push(totalPages);
  }

  return range;
}

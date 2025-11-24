import { base44 } from '@/api/base44Client';

/**
 * AUDIT FIX: MEDIUM Priority Issue #23 - Invoice Number Generation
 *
 * Hook to generate sequential numbers for invoices, jobs, quotations, etc.
 *
 * Usage:
 *   const generateNumber = useSequentialNumber();
 *   const invoiceNumber = await generateNumber('invoice');
 *   const jobNumber = await generateNumber('job', 'CUSTOM');
 *
 * @returns {Function} generateNumber(type, customPrefix?)
 */
export function useSequentialNumber() {
  /**
   * Generate a sequential number
   * @param {string} type - Type of number: 'invoice', 'quotation', 'job', 'service_call', etc.
   * @param {string} customPrefix - Optional custom prefix (default uses type-based prefix)
   * @returns {Promise<string>} Formatted number (e.g., "INV-2025-0001")
   */
  const generateNumber = async (type, customPrefix = null) => {
    try {
      const { data } = await base44.functions.invoke('generateSequentialNumber', {
        type,
        prefix: customPrefix
      });

      return data.number;
    } catch (error) {
      console.error('Error generating sequential number:', error);
      // Fallback to timestamp-based number if backend fails
      const fallback = `${(customPrefix || type.toUpperCase())}-${Date.now()}`;
      console.warn('Using fallback number:', fallback);
      return fallback;
    }
  };

  return generateNumber;
}

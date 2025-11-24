/**
 * Sequential Number Generator Service
 * Generates sequential numbers for invoices, jobs, quotes, etc.
 * Replaces Base44 function: generateSequentialNumber
 */

import { query, transaction } from '../database/config.js';
import { badRequest } from '../middleware/errorHandler.js';

/**
 * Generate next sequential number for a given type and format
 * @param {string} type - Entity type (invoice, job, quote, etc.)
 * @param {string} format - Number format (e.g., 'INV-{YYYY}-{####}')
 * @param {Object} options - Additional options
 * @returns {Promise<string>} Generated number
 */
export async function generateSequentialNumber(type, format = null, options = {}) {
  const { prefix = '', year = new Date().getFullYear(), resetYearly = true } = options;

  // Default formats if not provided
  const defaultFormats = {
    invoice: 'INV-{YYYY}-{####}',
    job: 'JOB-{YYYY}-{####}',
    quote: 'QUO-{YYYY}-{####}',
    payment: 'PAY-{YYYY}-{####}',
    customer: 'CUS-{####}',
    technician: 'TECH-{####}',
    material: 'MAT-{####}',
    asset: 'AST-{YYYY}-{####}',
    service_call: 'SC-{YYYY}-{####}'
  };

  const numberFormat = format || defaultFormats[type] || '{####}';

  // Use transaction to ensure atomicity
  const result = await transaction(async (client) => {
    // Get current counter for this type
    const sequenceKey = resetYearly ? `${type}_${year}` : type;

    const counterResult = await client.query(
      `INSERT INTO sequential_counters (counter_type, counter_value, year)
       VALUES ($1, 1, $2)
       ON CONFLICT (counter_type, year)
       DO UPDATE SET counter_value = sequential_counters.counter_value + 1
       RETURNING counter_value`,
      [type, resetYearly ? year : null]
    );

    const counterValue = counterResult.rows[0].counter_value;

    // Format the number
    const formattedNumber = formatSequentialNumber(numberFormat, counterValue, {
      year,
      prefix,
      type
    });

    return formattedNumber;
  });

  return result;
}

/**
 * Format sequential number according to format string
 * @param {string} format - Format string
 * @param {number} counter - Counter value
 * @param {Object} data - Data for replacements
 * @returns {string} Formatted number
 */
function formatSequentialNumber(format, counter, data = {}) {
  let formatted = format;

  // Replace year patterns
  formatted = formatted.replace(/\{YYYY\}/g, data.year || new Date().getFullYear());
  formatted = formatted.replace(/\{YY\}/g, String(data.year || new Date().getFullYear()).slice(-2));

  // Replace month patterns
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  formatted = formatted.replace(/\{MM\}/g, month);

  // Replace day patterns
  const day = String(new Date().getDate()).padStart(2, '0');
  formatted = formatted.replace(/\{DD\}/g, day);

  // Replace counter patterns
  // {####} = 4 digits with leading zeros
  // {###} = 3 digits
  // {#} = no padding
  const counterMatch = formatted.match(/\{(#+)\}/);
  if (counterMatch) {
    const padding = counterMatch[1].length;
    const paddedCounter = String(counter).padStart(padding, '0');
    formatted = formatted.replace(/\{#+\}/, paddedCounter);
  }

  // Replace prefix
  if (data.prefix) {
    formatted = formatted.replace(/\{PREFIX\}/g, data.prefix);
  }

  // Replace type
  if (data.type) {
    formatted = formatted.replace(/\{TYPE\}/g, data.type.toUpperCase());
  }

  return formatted;
}

/**
 * Get current counter value for a type
 * @param {string} type - Entity type
 * @param {number} year - Year (if yearly reset)
 * @returns {Promise<number>} Current counter value
 */
export async function getCurrentCounter(type, year = null) {
  const result = await query(
    `SELECT counter_value FROM sequential_counters
     WHERE counter_type = $1 AND (year = $2 OR year IS NULL)
     ORDER BY counter_value DESC
     LIMIT 1`,
    [type, year]
  );

  return result.rows.length > 0 ? result.rows[0].counter_value : 0;
}

/**
 * Reset counter for a type
 * @param {string} type - Entity type
 * @param {number} year - Year (if yearly reset)
 * @returns {Promise<boolean>} Success status
 */
export async function resetCounter(type, year = null) {
  await query(
    `UPDATE sequential_counters
     SET counter_value = 0
     WHERE counter_type = $1 AND (year = $2 OR ($2 IS NULL AND year IS NULL))`,
    [type, year]
  );

  return true;
}

/**
 * Set counter to specific value
 * @param {string} type - Entity type
 * @param {number} value - New counter value
 * @param {number} year - Year (if yearly reset)
 * @returns {Promise<boolean>} Success status
 */
export async function setCounter(type, value, year = null) {
  await query(
    `INSERT INTO sequential_counters (counter_type, counter_value, year)
     VALUES ($1, $2, $3)
     ON CONFLICT (counter_type, year)
     DO UPDATE SET counter_value = $2`,
    [type, value, year]
  );

  return true;
}

/**
 * Validate sequential number format
 * @param {string} format - Format string to validate
 * @returns {boolean} Whether format is valid
 */
export function validateFormat(format) {
  // Check for valid patterns
  const validPatterns = [
    /\{YYYY\}/,
    /\{YY\}/,
    /\{MM\}/,
    /\{DD\}/,
    /\{#+\}/,
    /\{PREFIX\}/,
    /\{TYPE\}/
  ];

  // Format should contain at least a counter pattern
  if (!/\{#+\}/.test(format)) {
    return false;
  }

  return true;
}

/**
 * Parse sequential number to extract components
 * @param {string} number - Sequential number to parse
 * @param {string} format - Format used to generate the number
 * @returns {Object} Parsed components
 */
export function parseSequentialNumber(number, format) {
  const components = {
    year: null,
    month: null,
    day: null,
    counter: null,
    prefix: null,
    type: null
  };

  // This is a simplified parser - would need more sophisticated logic
  // for production use with various format patterns

  // Extract year (YYYY)
  const yearMatch = number.match(/(\d{4})/);
  if (yearMatch) {
    components.year = parseInt(yearMatch[1]);
  }

  // Extract counter (last numeric sequence)
  const counterMatch = number.match(/(\d+)$/);
  if (counterMatch) {
    components.counter = parseInt(counterMatch[1]);
  }

  return components;
}

export default {
  generateSequentialNumber,
  getCurrentCounter,
  resetCounter,
  setCounter,
  validateFormat,
  parseSequentialNumber
};

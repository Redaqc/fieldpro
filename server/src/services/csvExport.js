/**
 * CSV Export Service
 * Export entities to CSV format
 * Replaces Base44 function: csvExport
 */

import { query } from '../database/config.js';
import { badRequest } from '../middleware/errorHandler.js';

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects
 * @param {Array} columns - Column definitions [{key, label}]
 * @returns {string} CSV string
 */
function convertToCSV(data, columns) {
  if (!data || data.length === 0) {
    return '';
  }

  // Create header row
  const headers = columns.map(col => escapeCSVValue(col.label || col.key)).join(',');

  // Create data rows
  const rows = data.map(item => {
    return columns.map(col => {
      const value = getNestedValue(item, col.key);
      return escapeCSVValue(value);
    }).join(',');
  });

  return [headers, ...rows].join('\n');
}

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Object to get value from
 * @param {string} path - Dot-notation path (e.g., 'user.name')
 * @returns {*} Value at path
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : '';
  }, obj);
}

/**
 * Escape CSV value (handle commas, quotes, newlines)
 * @param {*} value - Value to escape
 * @returns {string} Escaped value
 */
function escapeCSVValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  // Convert to string
  let stringValue = String(value);

  // Handle arrays and objects
  if (typeof value === 'object') {
    stringValue = JSON.stringify(value);
  }

  // Check if escaping is needed (contains comma, quote, or newline)
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    // Escape quotes by doubling them
    stringValue = stringValue.replace(/"/g, '""');
    // Wrap in quotes
    return `"${stringValue}"`;
  }

  return stringValue;
}

/**
 * Export entities to CSV
 * @param {string} entityType - Entity type (customers, jobs, etc.)
 * @param {Object} filters - Filter conditions
 * @param {Array} columns - Column definitions
 * @returns {Promise<string>} CSV content
 */
export async function exportEntityToCSV(entityType, filters = {}, columns = null) {
  // Map entity types to table names
  const tableMap = {
    customers: 'customers',
    jobs: 'jobs',
    invoices: 'invoices',
    quotations: 'quotations',
    time_entries: 'time_entries',
    technicians: 'technicians',
    materials: 'materials',
    payments: 'payments',
    service_calls: 'service_calls',
    assets: 'assets'
  };

  const tableName = tableMap[entityType];
  if (!tableName) {
    throw badRequest(`Unsupported entity type: ${entityType}`);
  }

  // Build query
  let queryText = `SELECT * FROM ${tableName}`;
  const values = [];
  const conditions = [];
  let paramCount = 1;

  // Apply filters
  if (filters.created_after) {
    conditions.push(`created_at >= $${paramCount++}`);
    values.push(filters.created_after);
  }

  if (filters.created_before) {
    conditions.push(`created_at <= $${paramCount++}`);
    values.push(filters.created_before);
  }

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      conditions.push(`status = ANY($${paramCount++})`);
      values.push(filters.status);
    } else {
      conditions.push(`status = $${paramCount++}`);
      values.push(filters.status);
    }
  }

  if (filters.is_active !== undefined) {
    conditions.push(`is_active = $${paramCount++}`);
    values.push(filters.is_active);
  }

  if (conditions.length > 0) {
    queryText += ` WHERE ${conditions.join(' AND ')}`;
  }

  queryText += ` ORDER BY created_at DESC`;

  if (filters.limit) {
    queryText += ` LIMIT $${paramCount++}`;
    values.push(filters.limit);
  }

  // Execute query
  const result = await query(queryText, values);

  // Define default columns if not provided
  if (!columns) {
    columns = getDefaultColumns(entityType, result.rows[0] || {});
  }

  // Convert to CSV
  const csv = convertToCSV(result.rows, columns);

  return csv;
}

/**
 * Get default columns for entity type
 * @param {string} entityType - Entity type
 * @param {Object} sampleRow - Sample row to infer columns
 * @returns {Array} Column definitions
 */
function getDefaultColumns(entityType, sampleRow) {
  // Predefined column sets for common entities
  const columnSets = {
    customers: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'company', label: 'Company' },
      { key: 'address', label: 'Address' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'zip', label: 'ZIP' },
      { key: 'is_active', label: 'Active' },
      { key: 'created_at', label: 'Created At' }
    ],
    jobs: [
      { key: 'id', label: 'ID' },
      { key: 'job_number', label: 'Job Number' },
      { key: 'title', label: 'Title' },
      { key: 'status', label: 'Status' },
      { key: 'priority', label: 'Priority' },
      { key: 'scheduled_date', label: 'Scheduled Date' },
      { key: 'total_amount', label: 'Total Amount' },
      { key: 'created_at', label: 'Created At' }
    ],
    invoices: [
      { key: 'id', label: 'ID' },
      { key: 'invoice_number', label: 'Invoice Number' },
      { key: 'status', label: 'Status' },
      { key: 'issue_date', label: 'Issue Date' },
      { key: 'due_date', label: 'Due Date' },
      { key: 'subtotal', label: 'Subtotal' },
      { key: 'tax_amount', label: 'Tax' },
      { key: 'total_amount', label: 'Total' },
      { key: 'paid_amount', label: 'Paid' },
      { key: 'created_at', label: 'Created At' }
    ],
    technicians: [
      { key: 'id', label: 'ID' },
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'hourly_rate', label: 'Hourly Rate' },
      { key: 'experience_level', label: 'Experience' },
      { key: 'is_active', label: 'Active' },
      { key: 'created_at', label: 'Created At' }
    ],
    materials: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'sku', label: 'SKU' },
      { key: 'category', label: 'Category' },
      { key: 'unit_price', label: 'Unit Price' },
      { key: 'cost_price', label: 'Cost Price' },
      { key: 'quantity_in_stock', label: 'Stock' },
      { key: 'unit', label: 'Unit' },
      { key: 'created_at', label: 'Created At' }
    ],
    payments: [
      { key: 'id', label: 'ID' },
      { key: 'invoice_id', label: 'Invoice ID' },
      { key: 'amount', label: 'Amount' },
      { key: 'payment_method', label: 'Payment Method' },
      { key: 'payment_date', label: 'Payment Date' },
      { key: 'reference_number', label: 'Reference' },
      { key: 'created_at', label: 'Created At' }
    ]
  };

  // Return predefined columns if available
  if (columnSets[entityType]) {
    return columnSets[entityType];
  }

  // Otherwise, generate from sample row keys
  return Object.keys(sampleRow).map(key => ({
    key,
    label: key.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }));
}

/**
 * Export custom query results to CSV
 * @param {string} queryText - SQL query
 * @param {Array} params - Query parameters
 * @param {Array} columns - Column definitions
 * @returns {Promise<string>} CSV content
 */
export async function exportCustomQueryToCSV(queryText, params = [], columns = null) {
  const result = await query(queryText, params);

  if (!columns) {
    columns = Object.keys(result.rows[0] || {}).map(key => ({
      key,
      label: key.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    }));
  }

  return convertToCSV(result.rows, columns);
}

export default {
  exportEntityToCSV,
  exportCustomQueryToCSV,
  convertToCSV
};

/**
 * CSV Import Service
 * Import entities from CSV format
 * Replaces Base44 function: csvImport
 */

import { query, transaction } from '../database/config.js';
import { badRequest } from '../middleware/errorHandler.js';

/**
 * Parse CSV string into array of objects
 * @param {string} csvContent - CSV content
 * @returns {Array} Array of objects
 */
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    return [];
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]);

  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length === 0 || (values.length === 1 && !values[0])) {
      continue; // Skip empty rows
    }

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    data.push(row);
  }

  return data;
}

/**
 * Parse a CSV line handling quoted values
 * @param {string} line - CSV line
 * @returns {Array} Array of values
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of value
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Push last value
  values.push(current);

  return values;
}

/**
 * Import entities from CSV
 * @param {string} entityType - Entity type (customers, jobs, etc.)
 * @param {string} csvContent - CSV content
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Import result
 */
export async function importEntityFromCSV(entityType, csvContent, options = {}) {
  const {
    updateExisting = false,
    validateOnly = false,
    mappings = {} // Column name mappings
  } = options;

  // Parse CSV
  const rows = parseCSV(csvContent);

  if (rows.length === 0) {
    throw badRequest('CSV file is empty');
  }

  // Map entity types to table names
  const entityConfigs = {
    customers: {
      table: 'customers',
      requiredFields: ['name'],
      uniqueField: 'email'
    },
    jobs: {
      table: 'jobs',
      requiredFields: ['title', 'customer_id'],
      uniqueField: 'job_number'
    },
    technicians: {
      table: 'technicians',
      requiredFields: ['first_name', 'last_name', 'email'],
      uniqueField: 'email'
    },
    materials: {
      table: 'materials',
      requiredFields: ['name', 'sku'],
      uniqueField: 'sku'
    }
  };

  const config = entityConfigs[entityType];
  if (!config) {
    throw badRequest(`Unsupported entity type: ${entityType}`);
  }

  const results = {
    total: rows.length,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  if (validateOnly) {
    // Validate only, don't import
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        validateRow(row, config, mappings);
      } catch (error) {
        results.errors.push({
          row: i + 2, // +2 because of 0-index and header row
          error: error.message
        });
        results.skipped++;
      }
    }

    return results;
  }

  // Import data with transaction
  await transaction(async (client) => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        // Validate row
        validateRow(row, config, mappings);

        // Map columns
        const mappedRow = mapColumns(row, mappings);

        // Check if record exists (for update mode)
        if (updateExisting && config.uniqueField && mappedRow[config.uniqueField]) {
          const existingResult = await client.query(
            `SELECT id FROM ${config.table} WHERE ${config.uniqueField} = $1`,
            [mappedRow[config.uniqueField]]
          );

          if (existingResult.rows.length > 0) {
            // Update existing record
            const id = existingResult.rows[0].id;
            await updateRecord(client, config.table, id, mappedRow);
            results.updated++;
            continue;
          }
        }

        // Insert new record
        await insertRecord(client, config.table, mappedRow);
        results.imported++;

      } catch (error) {
        results.errors.push({
          row: i + 2,
          error: error.message
        });
        results.skipped++;
      }
    }
  });

  return results;
}

/**
 * Validate CSV row
 * @param {Object} row - Row data
 * @param {Object} config - Entity config
 * @param {Object} mappings - Column mappings
 */
function validateRow(row, config, mappings) {
  // Check required fields
  for (const field of config.requiredFields) {
    const mappedField = Object.keys(mappings).find(k => mappings[k] === field) || field;
    if (!row[mappedField]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}

/**
 * Map column names
 * @param {Object} row - Row data
 * @param {Object} mappings - Column mappings
 * @returns {Object} Mapped row
 */
function mapColumns(row, mappings) {
  const mapped = {};

  for (const [csvColumn, dbColumn] of Object.entries(mappings)) {
    if (row[csvColumn] !== undefined) {
      mapped[dbColumn] = parseValue(row[csvColumn]);
    }
  }

  // Also copy unmapped columns (if they match database columns)
  for (const [key, value] of Object.entries(row)) {
    if (!mappings[key] && value !== undefined) {
      mapped[key] = parseValue(value);
    }
  }

  return mapped;
}

/**
 * Parse value to appropriate type
 * @param {string} value - String value from CSV
 * @returns {*} Parsed value
 */
function parseValue(value) {
  if (value === '' || value === null) {
    return null;
  }

  // Try to parse as number
  if (!isNaN(value) && value.trim() !== '') {
    return parseFloat(value);
  }

  // Try to parse as boolean
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;

  // Try to parse as JSON (for arrays/objects)
  if ((value.startsWith('[') && value.endsWith(']')) ||
      (value.startsWith('{') && value.endsWith('}'))) {
    try {
      return JSON.parse(value);
    } catch {
      // If JSON parse fails, return as string
    }
  }

  return value;
}

/**
 * Insert record into database
 * @param {Object} client - Database client
 * @param {string} table - Table name
 * @param {Object} data - Row data
 */
async function insertRecord(client, table, data) {
  const columns = Object.keys(data).filter(k => data[k] !== undefined);
  const values = columns.map(k => data[k]);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

  await client.query(
    `INSERT INTO ${table} (${columns.join(', ')}, created_at, updated_at)
     VALUES (${placeholders}, NOW(), NOW())`,
    values
  );
}

/**
 * Update existing record
 * @param {Object} client - Database client
 * @param {string} table - Table name
 * @param {string} id - Record ID
 * @param {Object} data - Row data
 */
async function updateRecord(client, table, id, data) {
  const columns = Object.keys(data).filter(k => data[k] !== undefined && k !== 'id');
  const values = columns.map(k => data[k]);
  const setClause = columns.map((k, i) => `${k} = $${i + 1}`).join(', ');

  values.push(id);

  await client.query(
    `UPDATE ${table}
     SET ${setClause}, updated_at = NOW()
     WHERE id = $${values.length}`,
    values
  );
}

/**
 * Generate CSV template for entity type
 * @param {string} entityType - Entity type
 * @returns {string} CSV template
 */
export function generateCSVTemplate(entityType) {
  const templates = {
    customers: 'name,email,phone,company,address,city,state,zip,country\n' +
                'Example Customer,customer@example.com,555-1234,Example Corp,123 Main St,San Francisco,CA,94105,USA',

    technicians: 'first_name,last_name,email,phone,hourly_rate,experience_level\n' +
                 'John,Doe,john@example.com,555-1234,75.00,senior',

    materials: 'name,sku,category,unit_price,cost_price,quantity_in_stock,unit\n' +
               'Example Material,SKU-001,Category A,100.00,60.00,50,piece',

    jobs: 'job_number,title,customer_id,status,priority,scheduled_date\n' +
          'JOB-2025-0001,Example Job,<customer_id>,to_do,medium,2025-11-23'
  };

  return templates[entityType] || '';
}

export default {
  importEntityFromCSV,
  parseCSV,
  generateCSVTemplate
};

/**
 * Data Export Service
 * Export database and application data
 * Replaces Base44 exportFullApp and exportDatabase functions
 */

import { query } from '../database/config.js';
import { badRequest } from '../middleware/errorHandler.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Export full database to JSON
 * @param {Object} options - Export options
 * @returns {Promise<Object>} Export result
 */
export async function exportDatabase(options = {}) {
  const {
    tables = null, // null = all tables
    include_sensitive = false,
    format = 'json'
  } = options;

  const exportData = {
    metadata: {
      exported_at: new Date().toISOString(),
      version: '1.0.0',
      database: 'fieldpro'
    },
    tables: {}
  };

  // Get list of tables to export
  const tablesToExport = tables || await getAllTables();

  // Tables with sensitive data
  const sensitiveTables = ['users'];

  for (const table of tablesToExport) {
    // Skip sensitive tables if not included
    if (!include_sensitive && sensitiveTables.includes(table)) {
      continue;
    }

    try {
      const result = await query(`SELECT * FROM ${table}`, []);

      // Sanitize sensitive fields
      const rows = result.rows.map(row => {
        if (table === 'users' && !include_sensitive) {
          const { password_hash, ...sanitized } = row;
          return sanitized;
        }
        return row;
      });

      exportData.tables[table] = {
        count: rows.length,
        data: rows
      };
    } catch (error) {
      console.error(`Error exporting table ${table}:`, error);
      exportData.tables[table] = {
        error: error.message
      };
    }
  }

  if (format === 'json') {
    return exportData;
  } else if (format === 'sql') {
    return convertToSQL(exportData);
  }

  return exportData;
}

/**
 * Export full application data (database + files)
 * @param {Object} options - Export options
 * @returns {Promise<Object>} Export result
 */
export async function exportFullApp(options = {}) {
  const {
    include_files = true,
    include_sensitive = false,
    output_path = null
  } = options;

  const exportPackage = {
    metadata: {
      exported_at: new Date().toISOString(),
      version: '1.0.0',
      includes_files: include_files
    },
    database: null,
    files: []
  };

  // Export database
  exportPackage.database = await exportDatabase({
    include_sensitive,
    format: 'json'
  });

  // Export file references
  if (include_files) {
    const documents = await query('SELECT * FROM documents', []);

    exportPackage.files = documents.rows.map(doc => ({
      id: doc.id,
      name: doc.name,
      file_url: doc.file_url,
      file_type: doc.file_type,
      file_size: doc.file_size,
      entity_type: doc.entity_type,
      entity_id: doc.entity_id
    }));
  }

  // Save to file if path provided
  if (output_path) {
    const filename = `fieldpro_export_${Date.now()}.json`;
    const filepath = path.join(output_path, filename);

    await fs.writeFile(filepath, JSON.stringify(exportPackage, null, 2));

    return {
      success: true,
      filename,
      filepath,
      size_bytes: (await fs.stat(filepath)).size
    };
  }

  return exportPackage;
}

/**
 * Export specific entity data
 * @param {string} entityType - Entity type to export
 * @param {Object} filters - Filters for export
 * @returns {Promise<Object>} Export result
 */
export async function exportEntityData(entityType, filters = {}) {
  const {
    start_date = null,
    end_date = null,
    limit = null
  } = filters;

  const conditions = [];
  const values = [];
  let paramCount = 1;

  if (start_date) {
    conditions.push(`created_at >= $${paramCount}`);
    values.push(start_date);
    paramCount++;
  }

  if (end_date) {
    conditions.push(`created_at <= $${paramCount}`);
    values.push(end_date);
    paramCount++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limitClause = limit ? `LIMIT ${limit}` : '';

  const result = await query(
    `SELECT * FROM ${entityType} ${whereClause} ORDER BY created_at DESC ${limitClause}`,
    values
  );

  return {
    entity_type: entityType,
    count: result.rows.length,
    exported_at: new Date().toISOString(),
    filters,
    data: result.rows
  };
}

/**
 * Import database from JSON
 * @param {Object} importData - Import data
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Import result
 */
export async function importDatabase(importData, options = {}) {
  const {
    skip_existing = true,
    validate_only = false,
    tables_to_import = null
  } = options;

  const results = {
    imported_tables: [],
    skipped_tables: [],
    errors: [],
    total_rows: 0
  };

  const tablesToProcess = tables_to_import || Object.keys(importData.tables);

  for (const table of tablesToProcess) {
    if (!importData.tables[table]) {
      results.skipped_tables.push(table);
      continue;
    }

    try {
      const tableData = importData.tables[table];

      if (tableData.error) {
        results.errors.push({
          table,
          error: tableData.error
        });
        continue;
      }

      if (validate_only) {
        results.imported_tables.push({
          table,
          rows: tableData.count,
          validated: true
        });
        continue;
      }

      // Import rows
      let imported = 0;
      for (const row of tableData.data) {
        try {
          const fields = Object.keys(row);
          const values = Object.values(row);
          const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

          const insertQuery = `INSERT INTO ${table} (${fields.join(', ')})
                              VALUES (${placeholders})
                              ${skip_existing ? 'ON CONFLICT DO NOTHING' : ''}`;

          await query(insertQuery, values);
          imported++;
        } catch (error) {
          results.errors.push({
            table,
            row,
            error: error.message
          });
        }
      }

      results.imported_tables.push({
        table,
        rows: imported,
        total: tableData.count
      });
      results.total_rows += imported;
    } catch (error) {
      results.errors.push({
        table,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Get all table names from database
 * @returns {Promise<Array>} Table names
 */
async function getAllTables() {
  const result = await query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
    []
  );

  return result.rows.map(row => row.tablename);
}

/**
 * Convert export data to SQL format
 * @param {Object} exportData - Export data
 * @returns {string} SQL statements
 */
function convertToSQL(exportData) {
  let sql = `-- FieldPro Database Export\n`;
  sql += `-- Exported at: ${exportData.metadata.exported_at}\n\n`;

  for (const [table, tableData] of Object.entries(exportData.tables)) {
    if (tableData.error) continue;

    sql += `-- Table: ${table} (${tableData.count} rows)\n`;

    for (const row of tableData.data) {
      const fields = Object.keys(row);
      const values = Object.values(row).map(val => {
        if (val === null) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        return val;
      });

      sql += `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${values.join(', ')});\n`;
    }

    sql += '\n';
  }

  return sql;
}

/**
 * Create backup of database
 * @param {Object} options - Backup options
 * @returns {Promise<Object>} Backup result
 */
export async function createBackup(options = {}) {
  const {
    backup_name = `backup_${Date.now()}`,
    include_sensitive = false,
    compress = false
  } = options;

  const exportData = await exportDatabase({
    include_sensitive,
    format: 'json'
  });

  return {
    backup_name,
    created_at: new Date().toISOString(),
    size: JSON.stringify(exportData).length,
    tables_count: Object.keys(exportData.tables).length,
    total_rows: Object.values(exportData.tables).reduce((sum, table) => sum + (table.count || 0), 0),
    data: exportData
  };
}

export default {
  exportDatabase,
  exportFullApp,
  exportEntityData,
  importDatabase,
  createBackup
};

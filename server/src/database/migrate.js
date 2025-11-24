/**
 * Database Migration Script
 * Run this to set up the PostgreSQL database with all tables
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('🚀 Starting database migration...\n');

  try {
    // Read schema SQL file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📖 Read schema.sql successfully');
    console.log('📊 Executing SQL statements...\n');

    // Execute schema
    await pool.query(schemaSql);

    console.log('✅ Database migration completed successfully!\n');
    console.log('📋 Created tables:');
    console.log('   - users, customers, technicians');
    console.log('   - jobs, service_calls, recurring_jobs');
    console.log('   - invoices, payments, quotations');
    console.log('   - time_entries, materials, assets');
    console.log('   - gps_tracking, gps_zones, gps_alerts');
    console.log('   - form_templates, form_submissions, form_automations');
    console.log('   - checklist_templates, automations');
    console.log('   - notifications, notification_templates');
    console.log('   - documents, custom_fields, webhooks');
    console.log('   - profitability_records, supplier_invoices');
    console.log('   - price_lists, work_types');
    console.log('   - company_info, tax_settings, app_settings');
    console.log('   - invoice_line_items, quotation_line_items');
    console.log('   - job_materials, asset_assignments');
    console.log('   - push_subscriptions, activity_log');
    console.log('   + All indexes and triggers\n');

    // Get table count
    const result = await pool.query(`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);

    console.log(`📊 Total tables created: ${result.rows[0].table_count}\n`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration();

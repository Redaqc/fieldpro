/**
 * Database Seeding Script
 * Adds initial/demo data to the database
 */

import bcrypt from 'bcryptjs';
import { pool, query } from './config.js';

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Create admin user
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminResult = await query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['admin@fieldpro.com', hashedPassword, 'Admin User', 'admin']
    );

    if (adminResult.rows.length > 0) {
      console.log('   ✅ Admin user created: admin@fieldpro.com / admin123');
    } else {
      console.log('   ℹ️  Admin user already exists');
    }

    // Create demo manager
    console.log('👤 Creating demo manager...');
    const managerPassword = await bcrypt.hash('manager123', 10);

    await query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      ['manager@fieldpro.com', managerPassword, 'Manager User', 'manager']
    );
    console.log('   ✅ Manager user created: manager@fieldpro.com / manager123');

    // Create demo technician
    console.log('👤 Creating demo technician...');
    const techPassword = await bcrypt.hash('tech123', 10);

    const techUserResult = await query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['tech@fieldpro.com', techPassword, 'John Technician', 'technician']
    );

    if (techUserResult.rows.length > 0) {
      const techUserId = techUserResult.rows[0].id;

      // Create technician profile
      await query(
        `INSERT INTO technicians (user_id, first_name, last_name, email, phone, skills, hourly_rate, experience_level)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          techUserId,
          'John',
          'Technician',
          'tech@fieldpro.com',
          '+1234567890',
          ['plumbing', 'hvac', 'electrical'],
          75.00,
          'senior'
        ]
      );
      console.log('   ✅ Technician created: tech@fieldpro.com / tech123');
    }

    // Create company info
    console.log('🏢 Creating company info...');
    await query(
      `INSERT INTO company_info (company_name, legal_name, email, phone, address, city, state, zip, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT DO NOTHING`,
      [
        'FieldPro FSM',
        'FieldPro Field Service Management LLC',
        'contact@fieldpro.com',
        '+1-800-FIELDPRO',
        '123 Business Street',
        'San Francisco',
        'CA',
        '94105',
        'USA'
      ]
    );
    console.log('   ✅ Company info created');

    // Create default tax settings
    console.log('💰 Creating tax settings...');
    await query(
      `INSERT INTO tax_settings (tax_name, tax_rate, is_default, is_active)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      ['Sales Tax', 8.5, true, true]
    );
    console.log('   ✅ Tax settings created');

    // Create app settings
    console.log('⚙️  Creating app settings...');
    const settings = [
      ['timezone', 'America/Los_Angeles', 'string', 'Default timezone'],
      ['currency', 'USD', 'string', 'Default currency'],
      ['date_format', 'MM/DD/YYYY', 'string', 'Date format'],
      ['enable_gps_tracking', 'true', 'boolean', 'Enable GPS tracking']
    ];

    for (const [key, value, type, description] of settings) {
      await query(
        `INSERT INTO app_settings (setting_key, setting_value, setting_type, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (setting_key) DO NOTHING`,
        [key, value, type, description]
      );
    }
    console.log('   ✅ App settings created');

    // Create demo customer
    console.log('👥 Creating demo customer...');
    await query(
      `INSERT INTO customers (name, email, phone, company, address, city, state, zip, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        'Acme Corporation',
        'contact@acme.com',
        '+1-555-ACME',
        'Acme Corp',
        '456 Client Avenue',
        'San Francisco',
        'CA',
        '94105',
        'USA'
      ]
    );
    console.log('   ✅ Demo customer created');

    // Create demo materials
    console.log('📦 Creating demo materials...');
    const materials = [
      ['Pipe Fitting 1/2"', 'PF-12', 'Plumbing', 5.50, 3.00, 100],
      ['HVAC Filter 16x20', 'HF-1620', 'HVAC', 12.00, 7.50, 50],
      ['Electrical Wire 12AWG', 'EW-12', 'Electrical', 45.00, 30.00, 200]
    ];

    for (const [name, sku, category, price, cost, qty] of materials) {
      await query(
        `INSERT INTO materials (name, sku, category, unit_price, cost_price, quantity_in_stock, unit)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [name, sku, category, price, cost, qty, 'piece']
      );
    }
    console.log('   ✅ Demo materials created');

    console.log('\n✅ Database seeding completed successfully!\n');
    console.log('📋 Test credentials:');
    console.log('   Admin:     admin@fieldpro.com / admin123');
    console.log('   Manager:   manager@fieldpro.com / manager123');
    console.log('   Technician: tech@fieldpro.com / tech123\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seeding
seedDatabase();

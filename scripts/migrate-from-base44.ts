#!/usr/bin/env tsx

/**
 * Base44 to FieldPro Migration Script
 *
 * This script migrates data from Base44 JSON export to the new PostgreSQL database
 *
 * Usage:
 *   npm run migrate -- --tenant-slug=mycompany --json-file=./base44-export.json
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface Base44Export {
  customers?: any[];
  jobs?: any[];
  invoices?: any[];
  quotes?: any[];
  technicians?: any[];
  materials?: any[];
  assets?: any[];
  [key: string]: any;
}

async function getTenantId(tenantSlug: string): Promise<string> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });

  if (!tenant) {
    throw new Error(`Tenant with slug '${tenantSlug}' not found`);
  }

  return tenant.id;
}

async function migrateCustomers(tenantSchema: string, customers: any[]) {
  console.log(`Migrating ${customers.length} customers...`);

  for (const customer of customers) {
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "${tenantSchema}".customers (
          id, customer_number, company_name, first_name, last_name,
          email, phone, mobile, billing_address, shipping_address,
          notes, tags, custom_fields, is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        )
        ON CONFLICT (id) DO NOTHING
      `,
        customer._id || customer.id,
        customer.customerNumber || `CUST-${Math.random().toString(36).substr(2, 9)}`,
        customer.companyName || customer.company,
        customer.firstName || customer.first_name,
        customer.lastName || customer.last_name,
        customer.email,
        customer.phone,
        customer.mobile || customer.cellPhone,
        JSON.stringify(customer.billingAddress || customer.billing_address),
        JSON.stringify(customer.shippingAddress || customer.shipping_address),
        customer.notes,
        customer.tags || [],
        JSON.stringify(customer.customFields || customer.custom_fields || {}),
        customer.isActive !== false,
        customer.createdAt || customer._createdAt || new Date(),
        customer.updatedAt || customer._updatedAt || new Date()
      );
    } catch (error) {
      console.error(`Error migrating customer ${customer._id}:`, error.message);
    }
  }

  console.log('Customers migration complete');
}

async function migrateTechnicians(tenantSchema: string, technicians: any[]) {
  console.log(`Migrating ${technicians.length} technicians...`);

  for (const tech of technicians) {
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "${tenantSchema}".technicians (
          id, first_name, last_name, email, phone, mobile,
          avatar_url, is_active, skills, certifications,
          custom_fields, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        )
        ON CONFLICT (id) DO NOTHING
      `,
        tech._id || tech.id,
        tech.firstName || tech.first_name,
        tech.lastName || tech.last_name,
        tech.email,
        tech.phone,
        tech.mobile || tech.cellPhone,
        tech.avatarUrl || tech.avatar_url,
        tech.isActive !== false,
        tech.skills || [],
        JSON.stringify(tech.certifications || []),
        JSON.stringify(tech.customFields || tech.custom_fields || {}),
        tech.createdAt || tech._createdAt || new Date(),
        tech.updatedAt || tech._updatedAt || new Date()
      );
    } catch (error) {
      console.error(`Error migrating technician ${tech._id}:`, error.message);
    }
  }

  console.log('Technicians migration complete');
}

async function migrateJobs(tenantSchema: string, jobs: any[]) {
  console.log(`Migrating ${jobs.length} jobs...`);

  for (const job of jobs) {
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "${tenantSchema}".jobs (
          id, job_number, customer_id, title, description,
          status, priority, scheduled_date, completed_date,
          assigned_to, address, custom_fields, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        )
        ON CONFLICT (id) DO NOTHING
      `,
        job._id || job.id,
        job.jobNumber || job.job_number || `JOB-${Math.random().toString(36).substr(2, 9)}`,
        job.customerId || job.customer_id || job.customer?._id,
        job.title || job.name,
        job.description,
        job.status || 'pending',
        job.priority || 'medium',
        job.scheduledDate || job.scheduled_date,
        job.completedDate || job.completed_date,
        job.assignedTo || job.assigned_to || job.technician?._id,
        JSON.stringify(job.address || job.location),
        JSON.stringify(job.customFields || job.custom_fields || {}),
        job.createdAt || job._createdAt || new Date(),
        job.updatedAt || job._updatedAt || new Date()
      );
    } catch (error) {
      console.error(`Error migrating job ${job._id}:`, error.message);
    }
  }

  console.log('Jobs migration complete');
}

async function migrateInvoices(tenantSchema: string, invoices: any[]) {
  console.log(`Migrating ${invoices.length} invoices...`);

  for (const invoice of invoices) {
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "${tenantSchema}".invoices (
          id, invoice_number, customer_id, job_id, status,
          issue_date, due_date, line_items, subtotal, tax_amount,
          discount_amount, total, notes, terms, sent_at, paid_at,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        )
        ON CONFLICT (id) DO NOTHING
      `,
        invoice._id || invoice.id,
        invoice.invoiceNumber || invoice.invoice_number || `INV-${Math.random().toString(36).substr(2, 9)}`,
        invoice.customerId || invoice.customer_id || invoice.customer?._id,
        invoice.jobId || invoice.job_id || invoice.job?._id,
        invoice.status || 'draft',
        invoice.issueDate || invoice.issue_date || new Date(),
        invoice.dueDate || invoice.due_date || new Date(),
        JSON.stringify(invoice.lineItems || invoice.line_items || []),
        invoice.subtotal || 0,
        invoice.taxAmount || invoice.tax_amount || 0,
        invoice.discountAmount || invoice.discount_amount || 0,
        invoice.total || 0,
        invoice.notes,
        invoice.terms,
        invoice.sentAt || invoice.sent_at,
        invoice.paidAt || invoice.paid_at,
        invoice.createdAt || invoice._createdAt || new Date(),
        invoice.updatedAt || invoice._updatedAt || new Date()
      );
    } catch (error) {
      console.error(`Error migrating invoice ${invoice._id}:`, error.message);
    }
  }

  console.log('Invoices migration complete');
}

async function migrateQuotations(tenantSchema: string, quotes: any[]) {
  console.log(`Migrating ${quotes.length} quotations...`);

  for (const quote of quotes) {
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "${tenantSchema}".quotations (
          id, quotation_number, customer_id, job_id, title,
          status, issue_date, valid_until, line_items, subtotal,
          tax_amount, discount_amount, total, notes, terms,
          accepted_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        )
        ON CONFLICT (id) DO NOTHING
      `,
        quote._id || quote.id,
        quote.quoteNumber || quote.quotation_number || `QUO-${Math.random().toString(36).substr(2, 9)}`,
        quote.customerId || quote.customer_id || quote.customer?._id,
        quote.jobId || quote.job_id || quote.job?._id,
        quote.title || quote.name,
        quote.status || 'draft',
        quote.issueDate || quote.issue_date || new Date(),
        quote.validUntil || quote.valid_until || new Date(),
        JSON.stringify(quote.lineItems || quote.line_items || []),
        quote.subtotal || 0,
        quote.taxAmount || quote.tax_amount || 0,
        quote.discountAmount || quote.discount_amount || 0,
        quote.total || 0,
        quote.notes,
        quote.terms,
        quote.acceptedAt || quote.accepted_at,
        quote.createdAt || quote._createdAt || new Date(),
        quote.updatedAt || quote._updatedAt || new Date()
      );
    } catch (error) {
      console.error(`Error migrating quotation ${quote._id}:`, error.message);
    }
  }

  console.log('Quotations migration complete');
}

async function migrateMaterials(tenantSchema: string, materials: any[]) {
  console.log(`Migrating ${materials.length} materials...`);

  for (const material of materials) {
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "${tenantSchema}".materials (
          id, name, sku, description, category, cost_price,
          sell_price, quantity_in_stock, reorder_level, unit,
          is_active, supplier, custom_fields, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        )
        ON CONFLICT (id) DO NOTHING
      `,
        material._id || material.id,
        material.name,
        material.sku,
        material.description,
        material.category,
        material.costPrice || material.cost_price || 0,
        material.sellPrice || material.sell_price || 0,
        material.quantityInStock || material.quantity_in_stock || 0,
        material.reorderLevel || material.reorder_level,
        material.unit,
        material.isActive !== false,
        material.supplier,
        JSON.stringify(material.customFields || material.custom_fields || {}),
        material.createdAt || material._createdAt || new Date(),
        material.updatedAt || material._updatedAt || new Date()
      );
    } catch (error) {
      console.error(`Error migrating material ${material._id}:`, error.message);
    }
  }

  console.log('Materials migration complete');
}

async function migrateAssets(tenantSchema: string, assets: any[]) {
  console.log(`Migrating ${assets.length} assets...`);

  for (const asset of assets) {
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "${tenantSchema}".assets (
          id, name, asset_tag, serial_number, model, manufacturer,
          category, customer_id, purchase_date, warranty_expires,
          location, status, notes, custom_fields, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        )
        ON CONFLICT (id) DO NOTHING
      `,
        asset._id || asset.id,
        asset.name,
        asset.assetTag || asset.asset_tag,
        asset.serialNumber || asset.serial_number,
        asset.model,
        asset.manufacturer,
        asset.category,
        asset.customerId || asset.customer_id || asset.customer?._id,
        asset.purchaseDate || asset.purchase_date,
        asset.warrantyExpires || asset.warranty_expires,
        asset.location,
        asset.status || 'active',
        asset.notes,
        JSON.stringify(asset.customFields || asset.custom_fields || {}),
        asset.createdAt || asset._createdAt || new Date(),
        asset.updatedAt || asset._updatedAt || new Date()
      );
    } catch (error) {
      console.error(`Error migrating asset ${asset._id}:`, error.message);
    }
  }

  console.log('Assets migration complete');
}

async function main() {
  const args = process.argv.slice(2);
  const tenantSlug = args.find(arg => arg.startsWith('--tenant-slug='))?.split('=')[1];
  const jsonFile = args.find(arg => arg.startsWith('--json-file='))?.split('=')[1];

  if (!tenantSlug || !jsonFile) {
    console.error('Usage: npm run migrate -- --tenant-slug=mycompany --json-file=./base44-export.json');
    process.exit(1);
  }

  console.log(`Starting migration for tenant: ${tenantSlug}`);
  console.log(`Reading data from: ${jsonFile}`);

  // Read Base44 export
  const fullPath = path.resolve(jsonFile);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }

  const data: Base44Export = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));

  // Get tenant
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });

  if (!tenant) {
    console.error(`Tenant '${tenantSlug}' not found. Please create the tenant first.`);
    process.exit(1);
  }

  const tenantSchema = tenant.schema_name;
  console.log(`Using schema: ${tenantSchema}`);

  // Migrate data in order (respecting foreign key constraints)
  try {
    if (data.customers) {
      await migrateCustomers(tenantSchema, data.customers);
    }

    if (data.technicians) {
      await migrateTechnicians(tenantSchema, data.technicians);
    }

    if (data.materials) {
      await migrateMaterials(tenantSchema, data.materials);
    }

    if (data.assets) {
      await migrateAssets(tenantSchema, data.assets);
    }

    if (data.jobs) {
      await migrateJobs(tenantSchema, data.jobs);
    }

    if (data.quotes || data.quotations) {
      await migrateQuotations(tenantSchema, data.quotes || data.quotations);
    }

    if (data.invoices) {
      await migrateInvoices(tenantSchema, data.invoices);
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

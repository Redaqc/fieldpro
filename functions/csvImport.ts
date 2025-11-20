import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * CSV Import Handler
 * Imports Customers, Technicians, Assets, or Materials from CSV
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entity_type, csv_data } = await req.json();

    if (!entity_type || !csv_data) {
      return Response.json({ error: 'entity_type and csv_data required' }, { status: 400 });
    }

    const lines = csv_data.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return Response.json({ error: 'CSV must contain headers and at least one data row' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    let created = 0;
    let updated = 0;
    let failed = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((h, idx) => row[h] = values[idx]);

      try {
        if (entity_type === 'customers') {
          const existing = await base44.asServiceRole.entities.Customer.filter({ email: row.email });
          
          const customerData = {
            first_name: row.first_name || '',
            last_name: row.last_name || '',
            email: row.email,
            phone: row.phone,
            company_name: row.company_name,
            address: row.address,
            city: row.city,
            state: row.state || row.province,
            zip_code: row.zip_code || row.postal_code,
            status: row.status || 'active'
          };

          if (existing.length > 0) {
            await base44.asServiceRole.entities.Customer.update(existing[0].id, customerData);
            updated++;
          } else {
            await base44.asServiceRole.entities.Customer.create(customerData);
            created++;
          }
        }

        if (entity_type === 'technicians') {
          const existing = await base44.asServiceRole.entities.Technician.filter({ email: row.email });
          
          const techData = {
            first_name: row.first_name || '',
            last_name: row.last_name || '',
            email: row.email,
            phone: row.phone,
            specialization: row.specialization ? row.specialization.split(';') : [],
            hourly_rate: parseFloat(row.hourly_rate || 0),
            status: row.status || 'available',
            role: row.role || 'tech',
            employee_number: row.employee_number
          };

          if (existing.length > 0) {
            await base44.asServiceRole.entities.Technician.update(existing[0].id, techData);
            updated++;
          } else {
            await base44.asServiceRole.entities.Technician.create(techData);
            created++;
          }
        }

        if (entity_type === 'assets') {
          const existing = await base44.asServiceRole.entities.Asset.filter({ serial_number: row.serial_number });
          
          const assetData = {
            name: row.name,
            asset_number: row.asset_number,
            category: row.category,
            manufacturer: row.manufacturer,
            model: row.model,
            serial_number: row.serial_number,
            purchase_date: row.purchase_date,
            purchase_price: parseFloat(row.purchase_price || 0),
            status: row.status || 'active',
            location: row.location
          };

          if (existing.length > 0 && existing[0].serial_number) {
            await base44.asServiceRole.entities.Asset.update(existing[0].id, assetData);
            updated++;
          } else {
            await base44.asServiceRole.entities.Asset.create(assetData);
            created++;
          }
        }

        if (entity_type === 'materials') {
          const existing = await base44.asServiceRole.entities.Material.filter({ sku: row.sku });
          
          const materialData = {
            name: row.name,
            sku: row.sku,
            description: row.description,
            category: row.category,
            unit: row.unit,
            unit_price: parseFloat(row.unit_price || 0),
            stock_quantity: parseFloat(row.stock_quantity || 0),
            min_stock_level: parseFloat(row.min_stock_level || 0)
          };

          if (existing.length > 0) {
            await base44.asServiceRole.entities.Material.update(existing[0].id, materialData);
            updated++;
          } else {
            await base44.asServiceRole.entities.Material.create(materialData);
            created++;
          }
        }

      } catch (err) {
        failed++;
        console.error(`Failed to import row ${i}:`, err);
      }
    }

    return Response.json({
      success: true,
      created,
      updated,
      failed,
      total: lines.length - 1
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * CSV Export Handler
 * Exports Customers, Technicians, Assets, or Materials to CSV
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entity_type } = await req.json();

    if (!entity_type) {
      return Response.json({ error: 'entity_type required' }, { status: 400 });
    }

    let csvData = '';
    let filename = '';

    if (entity_type === 'customers') {
      const customers = await base44.entities.Customer.list();
      
      const headers = ['first_name', 'last_name', 'email', 'phone', 'company_name', 'address', 'city', 'state', 'zip_code', 'status'];
      const rows = customers.map(c => [
        c.first_name || '',
        c.last_name || '',
        c.email || '',
        c.phone || '',
        c.company_name || '',
        c.address || '',
        c.city || '',
        c.state || '',
        c.zip_code || '',
        c.status || 'active'
      ]);

      csvData = [headers, ...rows].map(row => row.join(',')).join('\n');
      filename = 'customers_export.csv';
    }

    if (entity_type === 'technicians') {
      const technicians = await base44.entities.Technician.list();
      
      const headers = ['first_name', 'last_name', 'email', 'phone', 'specialization', 'hourly_rate', 'status', 'role', 'employee_number'];
      const rows = technicians.map(t => [
        t.first_name || '',
        t.last_name || '',
        t.email || '',
        t.phone || '',
        (t.specialization || []).join(';'),
        t.hourly_rate || '',
        t.status || 'available',
        t.role || 'tech',
        t.employee_number || ''
      ]);

      csvData = [headers, ...rows].map(row => row.join(',')).join('\n');
      filename = 'technicians_export.csv';
    }

    if (entity_type === 'assets') {
      const assets = await base44.entities.Asset.list();
      
      const headers = ['name', 'asset_number', 'category', 'manufacturer', 'model', 'serial_number', 'purchase_date', 'purchase_price', 'status', 'location'];
      const rows = assets.map(a => [
        a.name || '',
        a.asset_number || '',
        a.category || '',
        a.manufacturer || '',
        a.model || '',
        a.serial_number || '',
        a.purchase_date || '',
        a.purchase_price || '',
        a.status || 'active',
        a.location || ''
      ]);

      csvData = [headers, ...rows].map(row => row.join(',')).join('\n');
      filename = 'assets_export.csv';
    }

    if (entity_type === 'materials') {
      const materials = await base44.entities.Material.list();
      
      const headers = ['name', 'sku', 'description', 'category', 'unit', 'unit_price', 'stock_quantity', 'min_stock_level'];
      const rows = materials.map(m => [
        m.name || '',
        m.sku || '',
        m.description || '',
        m.category || '',
        m.unit || '',
        m.unit_price || '',
        m.stock_quantity || '0',
        m.min_stock_level || ''
      ]);

      csvData = [headers, ...rows].map(row => row.join(',')).join('\n');
      filename = 'materials_export.csv';
    }

    return Response.json({
      success: true,
      csv: csvData,
      filename: filename
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
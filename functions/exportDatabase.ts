import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // Export all entities
    const database = {
      exported_at: new Date().toISOString(),
      exported_by: user.email,
      data: {}
    };

    const entities = [
      'Customer',
      'Technician', 
      'Job',
      'ServiceCall',
      'Invoice',
      'Quotation',
      'Material',
      'Asset',
      'TimeEntry',
      'PriceList',
      'Bundle',
      'WorkType',
      'GPSZone',
      'GPSTracking',
      'GPSAlert',
      'Notification',
      'Document',
      'FormTemplate',
      'FormSubmission',
      'ChecklistTemplate',
      'CompanyInfo',
      'TaxSettings',
      'LanguageSettings',
      'AppSettings'
    ];

    for (const entityName of entities) {
      try {
        const records = await base44.asServiceRole.entities[entityName].list();
        database.data[entityName] = records;
      } catch (error) {
        console.log(`[exportDatabase] Could not export ${entityName}:`, error.message);
        database.data[entityName] = [];
      }
    }

    // Return JSON
    return Response.json(database, {
      headers: {
        'Content-Disposition': `attachment; filename="database_export_${new Date().toISOString().split('T')[0]}.json"`
      }
    });

  } catch (error) {
    console.error('[exportDatabase] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
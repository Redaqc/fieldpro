import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Smart Inventory Tracking - auto-deduct materials when jobs complete
 * Trigger low-stock alerts and auto-reorder suggestions
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { job_id } = await req.json();

    if (!job_id) {
      return Response.json({ error: 'Missing job_id' }, { status: 400 });
    }

    // Get job with material usages
    const jobs = await base44.asServiceRole.entities.Job.filter({ id: job_id });
    const job = jobs[0];

    if (!job) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    const results = {
      materials_updated: 0,
      alerts_created: 0,
      errors: []
    };

    // Process each material usage
    for (const usage of (job.material_usages || [])) {
      try {
        const materials = await base44.asServiceRole.entities.Material.filter({ id: usage.material_id });
        const material = materials[0];

        if (!material) {
          results.errors.push(`Material ${usage.material_id} not found`);
          continue;
        }

        // Deduct from stock
        const newStock = (material.quantity_in_stock || 0) - usage.quantity;
        await base44.asServiceRole.entities.Material.update(material.id, {
          quantity_in_stock: Math.max(0, newStock)
        });

        results.materials_updated++;

        // Check if reorder needed
        if (newStock <= (material.reorder_level || 10)) {
          const existingAlerts = await base44.asServiceRole.entities.Alert.filter({
            type: 'low_stock',
            entity_id: material.id,
            status: 'active'
          });

          if (existingAlerts.length === 0) {
            await base44.asServiceRole.entities.Alert.create({
              type: 'low_stock',
              severity: newStock === 0 ? 'critical' : 'medium',
              title: `Low Stock: ${material.name}`,
              message: `Stock: ${newStock} ${material.unit}. Reorder level: ${material.reorder_level || 10}. Suggested order: ${material.reorder_quantity || 50} units.`,
              entity_type: 'Material',
              entity_id: material.id,
              status: 'active'
            });

            results.alerts_created++;
          }
        }

      } catch (err) {
        results.errors.push(`Material ${usage.material_id}: ${err.message}`);
      }
    }

    return Response.json({
      success: true,
      results
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
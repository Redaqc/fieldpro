import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Calculate profitability for a completed job
 * Auto-triggered when invoice is paid or job is completed
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { job_id, invoice_id } = await req.json();

    if (!job_id) {
      return Response.json({ error: 'Missing job_id' }, { status: 400 });
    }

    // Get job data
    const jobs = await base44.asServiceRole.entities.Job.filter({ id: job_id });
    const job = jobs[0];

    if (!job) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    // Get associated invoice
    let invoice = null;
    if (invoice_id) {
      const invoices = await base44.asServiceRole.entities.Invoice.filter({ id: invoice_id });
      invoice = invoices[0];
    } else if (job.invoice_id) {
      const invoices = await base44.asServiceRole.entities.Invoice.filter({ id: job.invoice_id });
      invoice = invoices[0];
    }

    // Calculate costs
    const laborCost = (job.total_time_spent || 0) * 75; // Default hourly rate
    const materialCost = (job.material_usages || []).reduce((sum, u) => sum + (u.total_cost || 0), 0);
    const equipmentCost = (job.asset_assignments || []).length * 50; // Flat rate per asset
    const overheadCost = laborCost * 0.15; // 15% overhead allocation

    const totalCost = laborCost + materialCost + equipmentCost + overheadCost;

    // Calculate revenue
    const actualRevenue = invoice?.total || 0;
    const quotedRevenue = job.invoice_total || 0;

    // Calculate profit
    const grossProfit = actualRevenue - totalCost;
    const profitMarginPercent = actualRevenue > 0 ? (grossProfit / actualRevenue) * 100 : 0;

    // Create or update profitability record
    const existingRecords = await base44.asServiceRole.entities.ProfitabilityRecord.filter({ 
      job_id: job.id 
    });

    const profitData = {
      job_id: job.id,
      work_item_type: 'job',
      quoted_revenue: quotedRevenue,
      actual_revenue: actualRevenue,
      labor_cost: laborCost,
      material_cost: materialCost,
      equipment_cost: equipmentCost,
      overhead_cost: overheadCost,
      total_cost: totalCost,
      gross_profit: grossProfit,
      profit_margin_percent: profitMarginPercent,
      calculated_at: new Date().toISOString(),
      invoice_id: invoice?.id || null
    };

    if (existingRecords.length > 0) {
      await base44.asServiceRole.entities.ProfitabilityRecord.update(
        existingRecords[0].id,
        profitData
      );
    } else {
      await base44.asServiceRole.entities.ProfitabilityRecord.create(profitData);
    }

    // Update invoice with profitability data
    if (invoice) {
      await base44.asServiceRole.entities.Invoice.update(invoice.id, {
        total_cost: totalCost,
        profit_margin: profitMarginPercent
      });
    }

    return Response.json({
      success: true,
      profitability: profitData,
      breakdown: {
        revenue: actualRevenue,
        costs: {
          labor: laborCost,
          materials: materialCost,
          equipment: equipmentCost,
          overhead: overheadCost,
          total: totalCost
        },
        profit: {
          gross: grossProfit,
          margin_percent: profitMarginPercent
        }
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
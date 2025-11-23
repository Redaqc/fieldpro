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

    /**
     * AUDIT FIX: MEDIUM Priority Issue #34 - Complete Profitability Calculation
     * Enhanced cost calculation with equipment hourly rates, subcontractor costs, and detailed overhead
     */

    // 1. LABOR COST: Calculate based on technician rates or default
    const laborCost = (job.total_time_spent || 0) * 75; // Default hourly rate (could be enhanced with actual tech rates)

    // 2. MATERIAL COST: Sum all material usages
    const materialCost = (job.material_usages || []).reduce((sum, u) => sum + (u.total_cost || 0), 0);

    // 3. EQUIPMENT COST: Calculate based on actual asset hourly rates
    let equipmentCost = 0;
    if (job.asset_assignments && job.asset_assignments.length > 0) {
      // Fetch actual asset details for proper hourly rates
      const assetIds = job.asset_assignments.map(a => a.asset_id).filter(id => id);
      if (assetIds.length > 0) {
        const assets = await base44.asServiceRole.entities.Asset.filter({
          id: { $in: assetIds }
        });

        // Calculate equipment cost based on actual hourly rates and usage time
        equipmentCost = job.asset_assignments.reduce((sum, assignment) => {
          const asset = assets.find(a => a.id === assignment.asset_id);
          const hourlyRate = asset?.hourly_rate || 50; // Default $50/hr if not specified
          const hoursUsed = assignment.hours_used || job.total_time_spent || 0;
          return sum + (hourlyRate * hoursUsed);
        }, 0);
      } else {
        // Fallback to flat rate if no asset IDs
        equipmentCost = job.asset_assignments.length * 50;
      }
    }

    // 4. SUBCONTRACTOR COST: Include if job used subcontractors
    const subcontractorCost = (job.subcontractor_costs || []).reduce((sum, s) => sum + (s.amount || 0), 0);

    // 5. OVERHEAD COST: More detailed allocation
    const overhead = {
      admin: laborCost * 0.10,        // 10% administrative overhead
      insurance: laborCost * 0.03,     // 3% insurance
      facility: laborCost * 0.02,      // 2% facility costs
      vehicle: equipmentCost * 0.05,   // 5% vehicle/equipment maintenance
      marketing: (laborCost + materialCost) * 0.01, // 1% marketing allocation
    };
    const overheadCost = Object.values(overhead).reduce((sum, cost) => sum + cost, 0);

    const totalCost = laborCost + materialCost + equipmentCost + subcontractorCost + overheadCost;

    // Calculate revenue
    const actualRevenue = invoice?.total || 0;
    const quotedRevenue = job.invoice_total || 0;

    // Calculate profit
    const grossProfit = actualRevenue - totalCost;
    const profitMarginPercent = actualRevenue > 0 ? (grossProfit / actualRevenue) * 100 : 0;

    // AUDIT FIX #34: Profit margin warnings
    const warnings = [];
    const recommendations = [];

    if (profitMarginPercent < 0) {
      warnings.push('LOSS: This job is operating at a loss');
      recommendations.push('Review pricing strategy and cost control measures');
    } else if (profitMarginPercent < 10) {
      warnings.push('LOW MARGIN: Profit margin below 10% minimum threshold');
      recommendations.push('Consider increasing prices or reducing costs');
    } else if (profitMarginPercent < 20) {
      warnings.push('MODERATE MARGIN: Profit margin below industry standard (20%)');
      recommendations.push('Look for opportunities to improve efficiency');
    }

    if (actualRevenue < quotedRevenue * 0.9) {
      warnings.push('REVENUE SHORTFALL: Actual revenue is significantly below quote');
      recommendations.push('Review scope changes and ensure all work is invoiced');
    }

    if (laborCost > actualRevenue * 0.5) {
      warnings.push('HIGH LABOR COST: Labor exceeds 50% of revenue');
      recommendations.push('Analyze time tracking and consider productivity improvements');
    }

    if (subcontractorCost > actualRevenue * 0.3) {
      warnings.push('HIGH SUBCONTRACTOR COST: Subcontractor costs exceed 30% of revenue');
      recommendations.push('Evaluate subcontractor rates and consider in-house alternatives');
    }

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
      subcontractor_cost: subcontractorCost,
      overhead_cost: overheadCost,
      overhead_breakdown: overhead,
      total_cost: totalCost,
      gross_profit: grossProfit,
      profit_margin_percent: profitMarginPercent,
      warnings: warnings,
      recommendations: recommendations,
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
        revenue: {
          quoted: quotedRevenue,
          actual: actualRevenue,
          variance: actualRevenue - quotedRevenue,
          variance_percent: quotedRevenue > 0 ? ((actualRevenue - quotedRevenue) / quotedRevenue) * 100 : 0
        },
        costs: {
          labor: laborCost,
          materials: materialCost,
          equipment: equipmentCost,
          subcontractors: subcontractorCost,
          overhead: overheadCost,
          overhead_breakdown: overhead,
          total: totalCost
        },
        profit: {
          gross: grossProfit,
          margin_percent: profitMarginPercent,
          status: profitMarginPercent < 0 ? 'LOSS' :
                  profitMarginPercent < 10 ? 'LOW' :
                  profitMarginPercent < 20 ? 'MODERATE' : 'GOOD'
        },
        analysis: {
          warnings: warnings,
          recommendations: recommendations,
          cost_breakdown_percent: {
            labor: actualRevenue > 0 ? (laborCost / actualRevenue) * 100 : 0,
            materials: actualRevenue > 0 ? (materialCost / actualRevenue) * 100 : 0,
            equipment: actualRevenue > 0 ? (equipmentCost / actualRevenue) * 100 : 0,
            subcontractors: actualRevenue > 0 ? (subcontractorCost / actualRevenue) * 100 : 0,
            overhead: actualRevenue > 0 ? (overheadCost / actualRevenue) * 100 : 0
          }
        }
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
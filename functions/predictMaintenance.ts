import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * AI-Powered Predictive Maintenance
 * Analyzes asset usage patterns and predicts maintenance needs
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { asset_id } = await req.json();

    if (!asset_id) {
      return Response.json({ error: 'Missing asset_id' }, { status: 400 });
    }

    // Get asset and its maintenance history
    const assets = await base44.asServiceRole.entities.Asset.filter({ id: asset_id });
    const asset = assets[0];

    if (!asset) {
      return Response.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Get maintenance schedules
    const schedules = await base44.asServiceRole.entities.MaintenanceSchedule.filter({ 
      asset_id: asset_id 
    });

    // Simple AI prediction based on usage and age
    const totalHours = asset.hours_used || 0;
    const ageYears = asset.purchase_date 
      ? (Date.now() - new Date(asset.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 365)
      : 0;

    // Calculate failure risk (simplified algorithm)
    let failureRisk = 0;
    
    // Age factor
    if (ageYears > 5) failureRisk += 30;
    else if (ageYears > 3) failureRisk += 15;
    
    // Usage factor
    if (totalHours > 10000) failureRisk += 40;
    else if (totalHours > 5000) failureRisk += 20;
    
    // Overdue maintenance factor
    const overdue = schedules.filter(s => s.status === 'overdue').length;
    failureRisk += overdue * 15;

    // Condition factor
    if (asset.condition === 'poor') failureRisk += 25;
    else if (asset.condition === 'fair') failureRisk += 10;

    failureRisk = Math.min(100, failureRisk);

    // Determine recommended action
    let recommendedAction = 'Continue routine maintenance';
    let urgency = 'normal';
    
    if (failureRisk > 70) {
      recommendedAction = 'URGENT: Schedule immediate inspection and potential replacement';
      urgency = 'urgent';
    } else if (failureRisk > 50) {
      recommendedAction = 'HIGH PRIORITY: Schedule detailed inspection soon';
      urgency = 'high';
    } else if (failureRisk > 30) {
      recommendedAction = 'Schedule preventive maintenance';
      urgency = 'medium';
    }

    // Predict next failure date
    const daysToFailure = Math.max(7, 365 - (failureRisk * 3));
    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + daysToFailure);

    const prediction = {
      asset_id: asset.id,
      asset_name: asset.name,
      failure_risk: Math.round(failureRisk),
      recommended_action: recommendedAction,
      urgency: urgency,
      predicted_failure_date: predictedDate.toISOString().split('T')[0],
      factors: {
        age_years: ageYears.toFixed(1),
        total_hours: totalHours,
        condition: asset.condition,
        overdue_maintenance: overdue
      }
    };

    // Update maintenance schedules with AI prediction
    for (const schedule of schedules) {
      await base44.asServiceRole.entities.MaintenanceSchedule.update(schedule.id, {
        ai_prediction: {
          failure_risk: prediction.failure_risk,
          recommended_action: prediction.recommended_action,
          predicted_date: prediction.predicted_failure_date
        }
      });
    }

    return Response.json({
      success: true,
      prediction
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
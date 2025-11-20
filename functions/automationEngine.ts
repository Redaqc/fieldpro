import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Automation Engine - runs periodically to check and execute automation rules
 * Handles: overdue alerts, low stock alerts, recurring jobs, auto-scheduling
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const results = {
      overdue_checks: 0,
      low_stock_checks: 0,
      recurring_jobs: 0,
      alerts_created: 0,
      errors: []
    };

    // Check for overdue jobs and service calls
    const jobs = await base44.asServiceRole.entities.Job.list();
    const serviceCalls = await base44.asServiceRole.entities.ServiceCall.list();
    const now = new Date();

    for (const job of jobs) {
      if (job.status !== 'completed' && job.status !== 'cancelled' && job.due_date) {
        const dueDate = new Date(job.due_date);
        if (dueDate < now && !job.is_overdue) {
          // Mark as overdue
          await base44.asServiceRole.entities.Job.update(job.id, { is_overdue: true });
          
          // Create alert
          await base44.asServiceRole.entities.Alert.create({
            type: 'overdue_job',
            severity: 'high',
            title: `Job Overdue: ${job.title}`,
            message: `Job #${job.job_number} is overdue. Due date was ${dueDate.toLocaleDateString()}`,
            entity_type: 'Job',
            entity_id: job.id,
            assigned_to: job.technicians?.map(t => t.email || '').filter(e => e) || [],
            status: 'active'
          });

          // Send notifications
          for (const tech of (job.technicians || [])) {
            try {
              await base44.asServiceRole.entities.Notification.create({
                type: 'alert',
                title: 'Job Overdue',
                message: `Job "${job.title}" is overdue`,
                user_email: tech.email || tech.id,
                read: false,
                link: `/jobs?id=${job.id}`
              });
            } catch (err) {
              results.errors.push(`Failed to notify ${tech.name}: ${err.message}`);
            }
          }
          
          results.alerts_created++;
        }
        results.overdue_checks++;
      }
    }

    for (const call of serviceCalls) {
      if (call.status !== 'completed' && call.status !== 'converted' && call.due_date) {
        const dueDate = new Date(call.due_date);
        if (dueDate < now && !call.is_overdue) {
          await base44.asServiceRole.entities.ServiceCall.update(call.id, { is_overdue: true });
          
          await base44.asServiceRole.entities.Alert.create({
            type: 'overdue_service_call',
            severity: 'high',
            title: `Service Call Overdue: ${call.title}`,
            message: `Service Call #${call.call_number} is overdue`,
            entity_type: 'ServiceCall',
            entity_id: call.id,
            assigned_to: call.technicians?.map(t => t.email || '').filter(e => e) || [],
            status: 'active'
          });
          
          results.alerts_created++;
        }
        results.overdue_checks++;
      }
    }

    // Check low stock materials
    const materials = await base44.asServiceRole.entities.Material.list();
    for (const material of materials) {
      if (material.quantity_in_stock <= (material.reorder_level || 10)) {
        const existingAlerts = await base44.asServiceRole.entities.Alert.filter({
          type: 'low_stock',
          entity_id: material.id,
          status: 'active'
        });

        if (existingAlerts.length === 0) {
          await base44.asServiceRole.entities.Alert.create({
            type: 'low_stock',
            severity: material.quantity_in_stock === 0 ? 'critical' : 'medium',
            title: `Low Stock: ${material.name}`,
            message: `Material "${material.name}" has ${material.quantity_in_stock} ${material.unit} remaining. Reorder level: ${material.reorder_level || 10}`,
            entity_type: 'Material',
            entity_id: material.id,
            status: 'active'
          });
          
          results.alerts_created++;
        }
        results.low_stock_checks++;
      }
    }

    // Generate recurring jobs
    const recurringJobs = await base44.asServiceRole.entities.RecurringJob.filter({ active: true });
    for (const template of recurringJobs) {
      const nextScheduled = template.next_scheduled ? new Date(template.next_scheduled) : new Date(template.start_date);
      
      if (nextScheduled <= now) {
        try {
          // Create job from template
          const newJob = await base44.asServiceRole.entities.Job.create({
            ...template.job_template,
            start_date: nextScheduled.toISOString(),
            due_date: new Date(nextScheduled.getTime() + (template.job_template.duration_days || 1) * 24 * 60 * 60 * 1000).toISOString(),
            status: 'scheduled',
            activity_log: [{
              timestamp: new Date().toISOString(),
              user: 'System',
              action: 'auto_generated',
              details: `Auto-generated from recurring template: ${template.template_name}`
            }]
          });

          // Calculate next scheduled date
          let nextDate = new Date(nextScheduled);
          switch (template.recurrence.frequency) {
            case 'daily':
              nextDate.setDate(nextDate.getDate() + (template.recurrence.interval || 1));
              break;
            case 'weekly':
              nextDate.setDate(nextDate.getDate() + 7 * (template.recurrence.interval || 1));
              break;
            case 'biweekly':
              nextDate.setDate(nextDate.getDate() + 14);
              break;
            case 'monthly':
              nextDate.setMonth(nextDate.getMonth() + (template.recurrence.interval || 1));
              break;
            case 'quarterly':
              nextDate.setMonth(nextDate.getMonth() + 3);
              break;
            case 'yearly':
              nextDate.setFullYear(nextDate.getFullYear() + 1);
              break;
          }

          // Update template
          await base44.asServiceRole.entities.RecurringJob.update(template.id, {
            last_generated: new Date().toISOString(),
            next_scheduled: nextDate.toISOString(),
            generated_jobs: [...(template.generated_jobs || []), newJob.id]
          });

          results.recurring_jobs++;
        } catch (err) {
          results.errors.push(`Failed to generate recurring job "${template.template_name}": ${err.message}`);
        }
      }
    }

    return Response.json({
      success: true,
      executed_at: new Date().toISOString(),
      results
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});
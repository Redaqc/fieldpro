import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Auto-complete job when completion form is submitted
 * Webhook triggered by form submission
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { form_submission_id } = await req.json();

    if (!form_submission_id) {
      return Response.json({ error: 'Missing form_submission_id' }, { status: 400 });
    }

    // Get form submission
    const submissions = await base44.asServiceRole.entities.FormSubmission.filter({ 
      id: form_submission_id 
    });
    const submission = submissions[0];

    if (!submission || !submission.job_id) {
      return Response.json({ error: 'Form submission not found or not linked to job' }, { status: 404 });
    }

    // Get form template to check if it's a completion form
    const templates = await base44.asServiceRole.entities.FormTemplate.filter({ 
      id: submission.form_template_id 
    });
    const template = templates[0];

    // Check if this is a completion-type form
    const isCompletionForm = template?.name?.toLowerCase().includes('completion') || 
                           template?.name?.toLowerCase().includes('final') ||
                           template?.category === 'completion';

    if (!isCompletionForm) {
      return Response.json({ 
        message: 'Not a completion form, no action taken',
        is_completion: false
      });
    }

    // Get the job
    const jobs = await base44.asServiceRole.entities.Job.filter({ id: submission.job_id });
    const job = jobs[0];

    if (!job) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if all required forms are submitted
    const allSubmissions = await base44.asServiceRole.entities.FormSubmission.filter({
      job_id: job.id,
      status: 'submitted'
    });

    const requiredFormsSubmitted = (job.forms_required || []).every(requiredFormId => {
      return allSubmissions.some(s => s.form_template_id === requiredFormId);
    });

    // Update job to completed if all requirements met
    if (requiredFormsSubmitted) {
      await base44.asServiceRole.entities.Job.update(job.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        activity_log: [
          ...(job.activity_log || []),
          {
            timestamp: new Date().toISOString(),
            user: submission.submitted_by,
            action: 'auto_completed',
            details: 'Job automatically completed after submission of completion form'
          }
        ]
      });

      // Send notification to admins
      const users = await base44.asServiceRole.entities.User.list();
      const admins = users.filter(u => u.role === 'admin');
      
      for (const admin of admins) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: admin.email,
          type: 'status_change',
          title: 'Job Auto-Completed',
          message: `"${job.title}" was automatically completed after form submission`,
          read: false,
          data: { 
            job_id: job.id,
            form_submission_id: submission.id,
            completed_by: submission.submitted_by
          }
        });
      }

      // Auto-generate invoice if enabled
      if (job.auto_invoice_enabled) {
        const laborCost = (job.total_time_spent || 0) * 75;
        const materialCost = (job.material_usages || []).reduce((sum, u) => sum + u.total_cost, 0);
        const subtotal = laborCost + materialCost;
        const tps = subtotal * 0.05;
        const tvq = subtotal * 0.09975;
        const total = subtotal + tps + tvq;

        const lineItems = [
          { description: job.title, quantity: 1, unit_price: 0, total: 0, type: 'title' }
        ];

        if (job.total_time_spent > 0) {
          lineItems.push({
            description: `Labor - ${job.total_time_spent.toFixed(2)} hours`,
            quantity: job.total_time_spent,
            unit_price: 75,
            total: laborCost,
            type: 'item'
          });
        }

        (job.material_usages || []).forEach(usage => {
          lineItems.push({
            description: usage.material_name,
            quantity: usage.quantity,
            unit_price: usage.unit_cost,
            total: usage.total_cost,
            type: 'item'
          });
        });

        await base44.asServiceRole.entities.Invoice.create({
          job_id: job.id,
          customer_id: job.customer_id,
          customer_name: job.customer_name,
          invoice_date: new Date().toISOString(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'draft',
          line_items: lineItems,
          subtotal,
          tps,
          tvq,
          total,
          notes: `Auto-generated from Job #${job.job_number || job.id}`
        });

        await base44.asServiceRole.entities.Job.update(job.id, {
          invoice_generated: true,
          status: 'invoiced'
        });
      }

      return Response.json({
        success: true,
        job_completed: true,
        invoice_generated: job.auto_invoice_enabled,
        message: 'Job completed successfully'
      });
    } else {
      return Response.json({
        success: true,
        job_completed: false,
        message: 'Form submitted but job not completed - waiting for other required forms'
      });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
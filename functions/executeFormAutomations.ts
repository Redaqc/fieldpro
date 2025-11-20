import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    if (!submission_id) {
      return Response.json({ error: 'submission_id required' }, { status: 400 });
    }

    // Get submission
    const submissions = await base44.asServiceRole.entities.FormSubmission.filter({ id: submission_id });
    const submission = submissions[0];

    if (!submission) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Get automations for this form template
    const automations = await base44.asServiceRole.entities.FormAutomation.filter({
      form_template_id: submission.form_template_id,
      active: true
    });

    const executedActions = [];

    for (const automation of automations) {
      // Check trigger conditions
      let shouldExecute = true;

      // Check status condition
      if (automation.trigger_conditions?.status?.length > 0) {
        if (!automation.trigger_conditions.status.includes(submission.status)) {
          shouldExecute = false;
        }
      }

      // Check field conditions
      if (shouldExecute && automation.trigger_conditions?.field_conditions) {
        for (const condition of automation.trigger_conditions.field_conditions) {
          const fieldValue = submission.data[condition.field_id];
          
          switch (condition.operator) {
            case 'equals':
              if (fieldValue !== condition.value) shouldExecute = false;
              break;
            case 'contains':
              if (!String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase())) {
                shouldExecute = false;
              }
              break;
            case 'greater_than':
              if (!(parseFloat(fieldValue) > parseFloat(condition.value))) shouldExecute = false;
              break;
            case 'less_than':
              if (!(parseFloat(fieldValue) < parseFloat(condition.value))) shouldExecute = false;
              break;
            case 'exists':
              if (!fieldValue && fieldValue !== 0 && fieldValue !== false) shouldExecute = false;
              break;
          }

          if (!shouldExecute) break;
        }
      }

      if (!shouldExecute) continue;

      // Execute actions
      for (const action of automation.actions) {
        try {
          switch (action.type) {
            case 'send_email': {
              const emailConfig = action.config;
              let emailBody = emailConfig.body || '';
              
              // Replace placeholders with submission data
              emailBody = emailBody.replace(/\{form_name\}/g, submission.form_name);
              emailBody = emailBody.replace(/\{submitted_by\}/g, submission.submitted_by_name);
              emailBody = emailBody.replace(/\{submission_date\}/g, submission.submission_date);
              
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: emailConfig.to || submission.submitted_by,
                subject: emailConfig.subject || `Nouvelle soumission: ${submission.form_name}`,
                body: emailBody
              });

              executedActions.push({ automation: automation.name, action: 'send_email', status: 'success' });
              break;
            }

            case 'create_job': {
              const jobConfig = action.config;
              const jobData = {
                title: jobConfig.title || `Job: ${submission.form_name}`,
                description: jobConfig.description || `Créé automatiquement depuis: ${submission.form_name}`,
                status: jobConfig.status || 'todo',
                priority: jobConfig.priority || 'medium',
                customer_id: submission.customer_id || jobConfig.customer_id,
                job_number: `JOB-${Date.now()}`,
              };

              await base44.asServiceRole.entities.Job.create(jobData);
              executedActions.push({ automation: automation.name, action: 'create_job', status: 'success' });
              break;
            }

            case 'update_document_status': {
              const docConfig = action.config;
              if (docConfig.document_id) {
                await base44.asServiceRole.entities.Document.update(docConfig.document_id, {
                  status: docConfig.status || 'active'
                });
                executedActions.push({ automation: automation.name, action: 'update_document_status', status: 'success' });
              }
              break;
            }

            case 'update_customer_status': {
              const customerConfig = action.config;
              if (submission.customer_id) {
                await base44.asServiceRole.entities.Customer.update(submission.customer_id, {
                  status: customerConfig.status || 'active'
                });
                executedActions.push({ automation: automation.name, action: 'update_customer_status', status: 'success' });
              }
              break;
            }

            case 'create_notification': {
              const notifConfig = action.config;
              const notificationData = {
                user_email: notifConfig.user_email || submission.submitted_by,
                type: 'system',
                title: notifConfig.title || 'Nouvelle soumission de formulaire',
                message: notifConfig.message || `${submission.form_name} a été soumis`,
                priority: notifConfig.priority || 'normal',
                data: { submission_id: submission.id }
              };

              await base44.asServiceRole.entities.Notification.create(notificationData);
              executedActions.push({ automation: automation.name, action: 'create_notification', status: 'success' });
              break;
            }

            case 'assign_technician': {
              const techConfig = action.config;
              if (submission.job_id && techConfig.technician_id) {
                const jobs = await base44.asServiceRole.entities.Job.filter({ id: submission.job_id });
                if (jobs[0]) {
                  const job = jobs[0];
                  const technicians = job.technicians || [];
                  
                  if (!technicians.find(t => t.id === techConfig.technician_id)) {
                    const techs = await base44.asServiceRole.entities.Technician.filter({ id: techConfig.technician_id });
                    if (techs[0]) {
                      const tech = techs[0];
                      technicians.push({
                        id: tech.id,
                        name: `${tech.first_name} ${tech.last_name}`,
                        time_spent: 0,
                        time_logs: []
                      });
                      await base44.asServiceRole.entities.Job.update(submission.job_id, { technicians });
                    }
                  }
                }
                executedActions.push({ automation: automation.name, action: 'assign_technician', status: 'success' });
              }
              break;
            }
          }
        } catch (actionError) {
          executedActions.push({ 
            automation: automation.name, 
            action: action.type, 
            status: 'error', 
            error: actionError.message 
          });
        }
      }

      // Update automation execution count
      await base44.asServiceRole.entities.FormAutomation.update(automation.id, {
        execution_count: (automation.execution_count || 0) + 1,
        last_execution: new Date().toISOString()
      });
    }

    return Response.json({
      success: true,
      executed_automations: automations.length,
      actions: executedActions
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
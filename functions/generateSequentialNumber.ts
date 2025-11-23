import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * AUDIT FIX: MEDIUM Priority Issue #23 - Invoice Number Generation
 *
 * Generate sequential numbers for invoices, jobs, quotations, etc.
 * Implements proper sequential numbering with prefix/suffix customization
 *
 * Format: {PREFIX}-{YEAR}-{SEQUENCE}
 * Examples:
 *   INV-2025-0001
 *   JOB-2025-0042
 *   QUO-2025-0003
 *   CALL-2025-0015
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { type, prefix } = await req.json();

    if (!type) {
      return Response.json({ error: 'Missing required field: type' }, { status: 400 });
    }

    // Get or create sequence counter for this type/year
    const currentYear = new Date().getFullYear();
    const sequenceKey = `${type}_${currentYear}`;

    // Try to find existing sequence counter
    let counters = await base44.asServiceRole.entities.SequenceCounter.filter({
      key: sequenceKey
    });

    let counter = counters[0];
    let nextNumber;

    if (counter) {
      // Increment existing counter
      nextNumber = counter.current_value + 1;
      await base44.asServiceRole.entities.SequenceCounter.update(counter.id, {
        current_value: nextNumber,
        last_used_at: new Date().toISOString()
      });
    } else {
      // Create new counter for this year
      nextNumber = 1;
      await base44.asServiceRole.entities.SequenceCounter.create({
        key: sequenceKey,
        type: type,
        year: currentYear,
        current_value: nextNumber,
        last_used_at: new Date().toISOString()
      });
    }

    // Format the number with leading zeros (4 digits)
    const paddedNumber = String(nextNumber).padStart(4, '0');

    // Determine prefix (use custom or default)
    const defaultPrefixes = {
      'invoice': 'INV',
      'quotation': 'QUO',
      'job': 'JOB',
      'service_call': 'CALL',
      'payment': 'PAY',
      'estimate': 'EST'
    };

    const finalPrefix = prefix || defaultPrefixes[type] || type.toUpperCase();

    // Generate formatted number
    const formattedNumber = `${finalPrefix}-${currentYear}-${paddedNumber}`;

    return Response.json({
      success: true,
      number: formattedNumber,
      sequence: nextNumber,
      year: currentYear,
      prefix: finalPrefix
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

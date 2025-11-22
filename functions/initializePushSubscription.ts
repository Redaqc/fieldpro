import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Initialize PushSubscription Entity
 *
 * This function attempts to create the PushSubscription entity in Base44
 * by making an initial access. In Base44, entities often auto-create on first use.
 *
 * If the entity doesn't auto-create, this will provide detailed instructions
 * for manual creation in the Base44 Dashboard.
 *
 * @returns {Object} Initialization status and instructions
 */
export default async function initializePushSubscription({ request }) {
  const base44 = createClientFromRequest(request);

  try {
    // Check if user has admin privileges
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return {
        success: false,
        error: 'Unauthorized: Only admin users can initialize entities',
        user_role: user?.role
      };
    }

    const result = {
      success: false,
      entity_name: 'PushSubscription',
      status: 'checking',
      steps_completed: [],
      steps_required: [],
      timestamp: new Date().toISOString()
    };

    // Step 1: Check if entity already exists
    result.steps_completed.push('Checking if PushSubscription entity exists...');

    try {
      const existingSubscriptions = await base44.asServiceRole.entities.PushSubscription.list();

      result.success = true;
      result.status = 'exists';
      result.record_count = existingSubscriptions.length;
      result.steps_completed.push('✅ PushSubscription entity already exists');
      result.message = `PushSubscription entity exists with ${existingSubscriptions.length} records`;

      // Verify entity has correct structure
      if (existingSubscriptions.length > 0) {
        const sample = existingSubscriptions[0];
        const hasRequiredFields =
          'user_email' in sample &&
          'endpoint' in sample &&
          'keys' in sample;

        if (hasRequiredFields) {
          result.steps_completed.push('✅ Entity has correct field structure');
          result.entity_valid = true;
        } else {
          result.steps_completed.push('⚠️ Entity exists but may be missing fields');
          result.entity_valid = false;
          result.warning = 'Entity exists but appears to be missing required fields';
        }
      }

      return result;

    } catch (error) {
      // Entity doesn't exist, try to create it
      result.steps_completed.push('Entity does not exist yet');
      result.status = 'creating';
    }

    // Step 2: Attempt to create entity by making a test record
    result.steps_completed.push('Attempting to initialize entity with test record...');

    try {
      // Create a test subscription record
      // In Base44, this should auto-create the entity if it doesn't exist
      const testSubscription = await base44.asServiceRole.entities.PushSubscription.create({
        user_email: 'test@initialization.temp',
        endpoint: 'https://test.endpoint.temp/initialization',
        keys: JSON.stringify({
          p256dh: 'test_key_p256dh',
          auth: 'test_key_auth'
        }),
        active: false,
        created_at: new Date().toISOString(),
        metadata: JSON.stringify({ test: true, purpose: 'entity_initialization' })
      });

      result.steps_completed.push('✅ Test record created successfully');
      result.test_record_id = testSubscription.id;
      result.status = 'created';

      // Clean up test record
      try {
        await base44.asServiceRole.entities.PushSubscription.delete(testSubscription.id);
        result.steps_completed.push('✅ Test record cleaned up');
      } catch (cleanupError) {
        result.steps_completed.push('⚠️ Could not delete test record - please delete manually');
        result.cleanup_warning = `Test record ID: ${testSubscription.id}`;
      }

      result.success = true;
      result.message = 'PushSubscription entity created successfully!';
      result.next_steps = [
        'Entity is now ready to use',
        'Push notifications can now be configured',
        'Users can subscribe to push notifications in the mobile app'
      ];

      return result;

    } catch (createError) {
      // Auto-creation failed, provide manual instructions
      result.status = 'manual_creation_required';
      result.error = createError.message;
      result.steps_completed.push('❌ Automatic entity creation failed');

      result.manual_creation_required = true;
      result.instructions = {
        title: 'Manual Entity Creation Required',
        message: 'The PushSubscription entity could not be auto-created. Please create it manually in Base44 Dashboard.',
        steps: [
          {
            step: 1,
            action: 'Go to Base44 Dashboard',
            url: 'https://base44.app/dashboard',
            description: 'Open your Base44 application dashboard'
          },
          {
            step: 2,
            action: 'Navigate to Entities',
            description: 'Click on "Entities" in the left sidebar menu'
          },
          {
            step: 3,
            action: 'Create New Entity',
            description: 'Click the "Create New Entity" or "+" button'
          },
          {
            step: 4,
            action: 'Name the Entity',
            value: 'PushSubscription',
            description: 'Enter exactly "PushSubscription" as the entity name (case-sensitive)'
          },
          {
            step: 5,
            action: 'Add Fields',
            fields: [
              {
                name: 'user_email',
                type: 'string',
                required: true,
                indexed: true,
                description: 'Email of the user subscribing'
              },
              {
                name: 'endpoint',
                type: 'string',
                required: true,
                indexed: true,
                description: 'Push notification endpoint URL from browser'
              },
              {
                name: 'keys',
                type: 'text',
                required: true,
                indexed: false,
                description: 'JSON string containing p256dh and auth keys'
              },
              {
                name: 'active',
                type: 'boolean',
                required: false,
                default: true,
                description: 'Whether subscription is active'
              },
              {
                name: 'created_at',
                type: 'datetime',
                required: false,
                auto: true,
                description: 'When subscription was created'
              },
              {
                name: 'updated_at',
                type: 'datetime',
                required: false,
                auto: true,
                description: 'When subscription was last updated'
              }
            ]
          },
          {
            step: 6,
            action: 'Configure Indexes',
            description: 'Set user_email and endpoint as indexed fields for fast queries'
          },
          {
            step: 7,
            action: 'Save Entity',
            description: 'Click "Save" or "Create" to finalize the entity'
          },
          {
            step: 8,
            action: 'Verify Creation',
            description: 'Run this function again or check that entity appears in entity list'
          }
        ],
        additional_help: {
          documentation: 'See DATABASE_SCHEMA.md lines 14-49 for complete schema',
          setup_guide: 'See SETUP.md for detailed setup instructions',
          support: 'Contact Base44 support if you encounter issues: https://base44.app/support'
        }
      };

      return result;
    }

  } catch (error) {
    console.error('Error initializing PushSubscription entity:', error);
    return {
      success: false,
      error: error.message || 'Failed to initialize PushSubscription entity',
      details: error.stack,
      recommendation: 'Please create the entity manually in Base44 Dashboard',
      documentation: 'See DATABASE_SCHEMA.md and SETUP.md for instructions'
    };
  }
}

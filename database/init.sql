-- FieldPro Database Initialization
-- This file creates the tenant schema creation function

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Function to create a tenant-specific schema
CREATE OR REPLACE FUNCTION create_tenant_schema(schema_name TEXT)
RETURNS void AS $$
BEGIN
  -- Create schema
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);

  -- Set search path for this schema
  EXECUTE format('SET search_path TO %I', schema_name);

  -- ============================================
  -- CUSTOMERS TABLE
  -- ============================================
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.customers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      customer_number VARCHAR(50) UNIQUE NOT NULL,
      company_name VARCHAR(255),
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      email VARCHAR(255),
      phone VARCHAR(50),
      mobile VARCHAR(50),
      billing_address JSONB,
      shipping_address JSONB,
      location GEOMETRY(Point, 4326),
      notes TEXT,
      tags TEXT[],
      custom_fields JSONB,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  ', schema_name);

  -- ✅ RACE CONDITION FIX: Create sequence for customer numbers
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I.customer_number_seq START 1', schema_name);

  -- ============================================
  -- TECHNICIANS TABLE
  -- ============================================
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.technicians (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      mobile VARCHAR(50),
      avatar_url TEXT,
      is_active BOOLEAN DEFAULT true,
      skills TEXT[],
      certifications JSONB,
      custom_fields JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  ', schema_name);

  -- ============================================
  -- MATERIALS TABLE
  -- ============================================
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.materials (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      sku VARCHAR(100) UNIQUE,
      description TEXT,
      category VARCHAR(100),
      cost_price DECIMAL(10, 2) NOT NULL,
      sell_price DECIMAL(10, 2) NOT NULL,
      quantity_in_stock INTEGER DEFAULT 0,
      reorder_level INTEGER,
      unit VARCHAR(50),
      is_active BOOLEAN DEFAULT true,
      supplier VARCHAR(255),
      custom_fields JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  ', schema_name);

  -- ============================================
  -- ASSETS TABLE
  -- ============================================
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.assets (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      asset_tag VARCHAR(100),
      serial_number VARCHAR(100),
      model VARCHAR(100),
      manufacturer VARCHAR(100),
      category VARCHAR(100),
      customer_id UUID,
      purchase_date DATE,
      warranty_expires DATE,
      location VARCHAR(255),
      status VARCHAR(50) DEFAULT ''active'',
      notes TEXT,
      custom_fields JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES %I.customers(id) ON DELETE SET NULL
    )
  ', schema_name, schema_name);

  -- ============================================
  -- JOBS TABLE
  -- ============================================
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.jobs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      job_number VARCHAR(50) UNIQUE NOT NULL,
      customer_id UUID NOT NULL,
      asset_id UUID,
      quotation_id UUID,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT ''pending'',
      priority VARCHAR(50) DEFAULT ''medium'',
      scheduled_date TIMESTAMP,
      completed_date TIMESTAMP,
      assigned_to UUID,
      location GEOMETRY(Point, 4326),
      address JSONB,
      custom_fields JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES %I.customers(id) ON DELETE CASCADE,
      FOREIGN KEY (asset_id) REFERENCES %I.assets(id) ON DELETE SET NULL,
      FOREIGN KEY (assigned_to) REFERENCES %I.technicians(id) ON DELETE SET NULL
    )
  ', schema_name, schema_name, schema_name, schema_name);

  -- ✅ RACE CONDITION FIX: Create sequence for job numbers
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I.job_number_seq START 1', schema_name);

  -- ============================================
  -- SERVICE CALLS TABLE
  -- ============================================
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.service_calls (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      call_number VARCHAR(50) UNIQUE NOT NULL,
      customer_id UUID NOT NULL,
      job_id UUID,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      priority VARCHAR(50) DEFAULT ''medium'',
      status VARCHAR(50) DEFAULT ''pending'',
      scheduled_date TIMESTAMP,
      assigned_to UUID,
      location GEOMETRY(Point, 4326),
      custom_fields JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES %I.customers(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES %I.jobs(id) ON DELETE SET NULL,
      FOREIGN KEY (assigned_to) REFERENCES %I.technicians(id) ON DELETE SET NULL
    )
  ', schema_name, schema_name, schema_name, schema_name);

  -- ✅ RACE CONDITION FIX: Create sequence for service call numbers
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I.service_call_number_seq START 1', schema_name);

  -- ============================================
  -- QUOTATIONS TABLE
  -- ============================================
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.quotations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      quotation_number VARCHAR(50) UNIQUE NOT NULL,
      customer_id UUID NOT NULL,
      job_id UUID,
      title VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT ''draft'',
      issue_date DATE NOT NULL,
      valid_until DATE NOT NULL,
      line_items JSONB NOT NULL,
      subtotal DECIMAL(10, 2) NOT NULL,
      tax_amount DECIMAL(10, 2) DEFAULT 0,
      discount_amount DECIMAL(10, 2) DEFAULT 0,
      total DECIMAL(10, 2) NOT NULL,
      notes TEXT,
      terms TEXT,
      accepted_at TIMESTAMP,
      declined_at TIMESTAMP,
      decline_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES %I.customers(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES %I.jobs(id) ON DELETE SET NULL
    )
  ', schema_name, schema_name, schema_name);

  -- ✅ RACE CONDITION FIX: Create sequence for quotation numbers
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I.quotation_number_seq START 1', schema_name);

  -- ============================================
  -- INVOICES TABLE
  -- ============================================
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.invoices (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      invoice_number VARCHAR(50) UNIQUE NOT NULL,
      customer_id UUID NOT NULL,
      job_id UUID,
      status VARCHAR(50) DEFAULT ''draft'',
      issue_date DATE NOT NULL,
      due_date DATE NOT NULL,
      line_items JSONB NOT NULL,
      subtotal DECIMAL(10, 2) NOT NULL,
      tax_amount DECIMAL(10, 2) DEFAULT 0,
      discount_amount DECIMAL(10, 2) DEFAULT 0,
      total DECIMAL(10, 2) NOT NULL,
      notes TEXT,
      terms TEXT,
      sent_at TIMESTAMP,
      paid_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES %I.customers(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES %I.jobs(id) ON DELETE SET NULL
    )
  ', schema_name, schema_name, schema_name);

  -- ✅ RACE CONDITION FIX: Create sequence for invoice numbers
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I.invoice_number_seq START 1', schema_name);

  -- ============================================
  -- PAYMENTS TABLE
  -- ============================================
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.payments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      invoice_id UUID NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      payment_date TIMESTAMP NOT NULL,
      payment_method VARCHAR(50),
      transaction_id VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES %I.invoices(id) ON DELETE CASCADE
    )
  ', schema_name, schema_name);

  -- ============================================
  -- ACTIVITIES TABLE
  -- ============================================
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.activities (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      entity_type VARCHAR(50) NOT NULL,
      entity_id UUID NOT NULL,
      user_id UUID,
      action VARCHAR(100) NOT NULL,
      description TEXT,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  ', schema_name);

  -- ============================================
  -- STOCK ADJUSTMENTS TABLE
  -- ============================================
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.stock_adjustments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      material_id UUID NOT NULL,
      adjustment INTEGER NOT NULL,
      previous_quantity INTEGER NOT NULL,
      new_quantity INTEGER NOT NULL,
      reason TEXT,
      created_by UUID,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (material_id) REFERENCES %I.materials(id) ON DELETE CASCADE
    )
  ', schema_name, schema_name);

  -- ============================================
  -- NOTIFICATIONS TABLE
  -- ============================================
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      priority VARCHAR(50) DEFAULT ''medium'',
      entity_type VARCHAR(50),
      entity_id UUID,
      action_url VARCHAR(500),
      metadata JSONB DEFAULT ''{}''::jsonb,
      is_read BOOLEAN DEFAULT false,
      read_at TIMESTAMP,
      sent_at TIMESTAMP,
      scheduled_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  ', schema_name);

  -- ============================================
  -- NOTIFICATION PREFERENCES TABLE
  -- ============================================
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.notification_preferences (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL UNIQUE,
      preferences JSONB NOT NULL DEFAULT ''{}''::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  ', schema_name);

  -- ============================================
  -- TIME ENTRIES TABLE
  -- ============================================
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.time_entries (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      type VARCHAR(50) NOT NULL,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP,
      duration_minutes INTEGER,
      job_id UUID,
      service_call_id UUID,
      description TEXT,
      is_billable BOOLEAN DEFAULT true,
      hourly_rate DECIMAL(10, 2),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES %I.jobs(id) ON DELETE SET NULL,
      FOREIGN KEY (service_call_id) REFERENCES %I.service_calls(id) ON DELETE SET NULL
    )
  ', schema_name, schema_name, schema_name);

  -- ============================================
  -- FORMS TABLE
  -- ============================================
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.forms (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100) NOT NULL,
      fields JSONB NOT NULL,
      require_signature BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      settings JSONB DEFAULT ''{}''::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  ', schema_name);

  -- ============================================
  -- FORM SUBMISSIONS TABLE
  -- ============================================
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.form_submissions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      form_id UUID NOT NULL,
      submitted_by UUID NOT NULL,
      responses JSONB NOT NULL,
      signature TEXT,
      job_id UUID,
      service_call_id UUID,
      customer_id UUID,
      metadata JSONB DEFAULT ''{}''::jsonb,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (form_id) REFERENCES %I.forms(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES %I.jobs(id) ON DELETE SET NULL,
      FOREIGN KEY (service_call_id) REFERENCES %I.service_calls(id) ON DELETE SET NULL,
      FOREIGN KEY (customer_id) REFERENCES %I.customers(id) ON DELETE SET NULL
    )
  ', schema_name, schema_name, schema_name, schema_name, schema_name);

  -- ============================================
  -- INDEXES
  -- ============================================
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_customers_email ON %I.customers(email)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_customers_location ON %I.customers USING GIST(location)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_jobs_customer ON %I.jobs(customer_id)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_jobs_assigned ON %I.jobs(assigned_to)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_jobs_status ON %I.jobs(status)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_service_calls_customer ON %I.service_calls(customer_id)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_invoices_customer ON %I.invoices(customer_id)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_quotations_customer ON %I.quotations(customer_id)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_activities_entity ON %I.activities(entity_type, entity_id)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_notifications_user ON %I.notifications(user_id)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_notifications_is_read ON %I.notifications(user_id, is_read)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_notification_preferences_user ON %I.notification_preferences(user_id)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_time_entries_user ON %I.time_entries(user_id)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_time_entries_job ON %I.time_entries(job_id)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_time_entries_service_call ON %I.time_entries(service_call_id)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_time_entries_start_time ON %I.time_entries(start_time)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_forms_category ON %I.forms(category)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_forms_is_active ON %I.forms(is_active)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_form_submissions_form ON %I.form_submissions(form_id)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_form_submissions_submitted_by ON %I.form_submissions(submitted_by)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_form_submissions_job ON %I.form_submissions(job_id)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_form_submissions_service_call ON %I.form_submissions(service_call_id)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_form_submissions_customer ON %I.form_submissions(customer_id)', schema_name, schema_name);

  -- Reset search path
  EXECUTE 'SET search_path TO public';

END;
$$ LANGUAGE plpgsql;

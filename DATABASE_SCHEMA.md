# FieldPro - Database Schema Documentation

**Database Platform**: Base44 (BaaS)
**Last Updated**: 2025-11-22

---

## 📊 Entity Overview

Total Entities: 45
Critical Entities: 2 require manual creation
Status: 43 entities auto-created, 2 need setup

---

## 🔴 CRITICAL ENTITIES (Require Creation)

### 1. PushSubscription

**Status**: ⚠️ MUST BE CREATED BEFORE USING PUSH NOTIFICATIONS

**Purpose**: Store web push notification subscriptions for mobile users

**Fields**:
```javascript
{
  id: "string (auto-generated)",
  user_email: "string (required, indexed)",
  endpoint: "string (required, unique URL from browser)",
  keys: "text (JSON string containing p256dh and auth keys)",
  active: "boolean (default: true)",
  created_at: "datetime (auto)",
  updated_at: "datetime (auto)"
}
```

**Indexes**:
- `user_email` (for filtering subscriptions by user)
- `endpoint` (for checking duplicates)

**Relationships**: None

**Used By**:
- `functions/savePushSubscription.ts`
- `src/components/mobile/PushNotifications.jsx`

**Creation Steps**:
1. Go to Base44 Dashboard → Entities
2. Click "Create New Entity"
3. Name: `PushSubscription`
4. Add fields as specified above
5. Set indexes on user_email and endpoint
6. Save

---

### 2. BrandingSettings

**Status**: 🟡 OPTIONAL - Create if branding customization needed

**Purpose**: Store application branding configuration

**Fields**:
```javascript
{
  id: "string (auto-generated)",
  logo_url: "string (URL to company logo)",
  primary_color: "string (hex color, e.g., #3B82F6)",
  secondary_color: "string (hex color)",
  company_name: "string",
  company_tagline: "string",
  favicon_url: "string",
  login_background_url: "string",
  email_logo_url: "string",
  created_at: "datetime",
  updated_at: "datetime"
}
```

**Used By**:
- `functions/exportFullApp.ts` (export only, gracefully handles if missing)

**Creation Steps**: (Optional)
1. Go to Base44 Dashboard → Entities
2. Create entity: `BrandingSettings`
3. Add branding fields as needed
4. Usually only 1 record needed

---

## ✅ EXISTING ENTITIES (Auto-Created)

### Core Entities

#### Alert
```javascript
{
  id: string,
  type: string,              // 'warning', 'info', 'critical'
  message: string,
  user_email: string,
  read: boolean,
  created_at: datetime
}
```

#### AppSettings
```javascript
{
  id: string,
  menu_modules: object,      // Module visibility config
  default_language: string,
  timezone: string,
  date_format: string,
  currency: string,
  company_info: object
}
```

#### Asset
```javascript
{
  id: string,
  asset_number: string,
  name: string,
  brand: string,
  model: string,
  serial_number: string,
  purchase_date: date,
  warranty_expiry: date,
  status: string,            // 'active', 'maintenance', 'retired'
  location: string,
  assigned_to: string,       // technician_id
  created_date: datetime
}
```

#### Automation
```javascript
{
  id: string,
  name: string,
  description: string,
  trigger_type: string,      // 'form_submission', 'job_status_change', etc.
  trigger_conditions: object,
  actions: object,           // Array of actions to perform
  active: boolean,
  created_at: datetime
}
```

#### Bundle
```javascript
{
  id: string,
  name: string,
  description: string,
  items: object,             // Array of bundle items
  total_price: number,
  discount_percentage: number,
  active: boolean
}
```

#### ChecklistTemplate
```javascript
{
  id: string,
  name: string,
  description: string,
  items: object,             // Array of checklist items
  category: string,
  created_by: string
}
```

#### CompanyInfo
```javascript
{
  id: string,
  company_name: string,
  address: string,
  city: string,
  state: string,
  zip_code: string,
  phone: string,
  email: string,
  website: string,
  tax_id: string,
  logo_url: string
}
```

#### CustomField
```javascript
{
  id: string,
  entity_type: string,       // 'job', 'customer', 'invoice', etc.
  field_name: string,
  field_type: string,        // 'text', 'number', 'date', 'select', etc.
  field_options: object,     // For select/multi-select fields
  required: boolean,
  default_value: string
}
```

#### Customer
```javascript
{
  id: string,
  first_name: string,
  last_name: string,
  email: string,
  phone: string,
  company_name: string,
  address: string,
  city: string,
  state: string,
  zip_code: string,
  notes: string,
  created_date: datetime,
  customer_type: string,     // 'residential', 'commercial'
  tags: array
}
```

#### CustomerFeedback
```javascript
{
  id: string,
  customer_id: string,
  job_id: string,
  rating: number,            // 1-5
  comments: string,
  created_at: datetime
}
```

#### DashboardConfig
```javascript
{
  id: string,
  user_email: string,
  visible_widgets: array,    // List of enabled widgets
  widget_positions: object,  // Layout configuration
  default_view: string
}
```

#### Document
```javascript
{
  id: string,
  name: string,
  description: string,
  file_url: string,
  file_type: string,
  file_size: number,
  category: string,
  tags: array,
  uploaded_by: string,
  uploaded_at: datetime,
  entity_type: string,       // 'job', 'customer', 'invoice'
  entity_id: string
}
```

#### FormAutomation
```javascript
{
  id: string,
  form_template_id: string,
  trigger_conditions: object,
  actions: object,           // Create job, send email, etc.
  active: boolean,
  created_at: datetime
}
```

#### FormSubmission
```javascript
{
  id: string,
  form_template_id: string,
  submitted_by: string,
  submission_data: object,   // Form field values
  submission_date: datetime,
  job_id: string,            // If linked to a job
  status: string
}
```

#### FormTemplate
```javascript
{
  id: string,
  name: string,
  description: string,
  fields: object,            // Array of form fields
  category: string,
  created_by: string,
  created_at: datetime,
  active: boolean
}
```

#### GPSAlert
```javascript
{
  id: string,
  technician_id: string,
  alert_type: string,        // 'geofence_exit', 'geofence_entry', 'speeding'
  zone_id: string,
  message: string,
  timestamp: datetime,
  acknowledged: boolean
}
```

#### GPSTracking
```javascript
{
  id: string,
  technician_id: string,
  latitude: number,
  longitude: number,
  accuracy: number,
  speed: number,
  heading: number,
  timestamp: datetime,
  battery_level: number
}
```

#### GPSZone
```javascript
{
  id: string,
  name: string,
  description: string,
  zone_type: string,         // 'geofence', 'service_area'
  coordinates: object,       // GeoJSON polygon
  radius: number,            // For circular zones
  active: boolean
}
```

#### Integration
```javascript
{
  id: string,
  name: string,
  type: string,              // 'quickbooks', 'stripe', 'zoho', 'sage50'
  status: string,            // 'active', 'inactive', 'error'
  config: object,
  last_sync: datetime,
  created_at: datetime
}
```

#### IntegrationSettings
```javascript
{
  id: string,
  integration_type: string,  // 'zoho_books', 'sage50', 'quickbooks'
  api_key: string,
  api_secret: string,
  access_token: string,
  refresh_token: string,
  organization_id: string,
  sage50_company_path: string,
  sage50_sync_mode: string,  // 'csv' or 'sdk'
  customer_filters: object,
  item_filters: object,
  enabled: boolean,
  last_sync_date: datetime
}
```

#### Invoice
```javascript
{
  id: string,
  invoice_number: string,
  customer_id: string,
  job_id: string,
  issue_date: date,
  due_date: date,
  status: string,            // 'draft', 'sent', 'paid', 'overdue'
  subtotal: number,
  tax: number,
  total: number,
  paid_amount: number,
  line_items: object,
  notes: string,
  created_date: datetime
}
```

#### Job
```javascript
{
  id: string,
  job_number: string,
  title: string,
  description: string,
  customer_id: string,
  assigned_technicians: array,
  status: string,            // 'pending', 'scheduled', 'in_progress', 'completed'
  priority: string,          // 'low', 'medium', 'high', 'urgent'
  scheduled_start: datetime,
  scheduled_end: datetime,
  actual_start: datetime,
  actual_end: datetime,
  address: string,
  latitude: number,
  longitude: number,
  estimated_hours: number,
  estimated_cost: number,
  actual_cost: number,
  tags: array,
  created_date: datetime
}
```

#### LanguageSettings
```javascript
{
  id: string,
  language: string,          // 'en' or 'fr'
  user_email: string         // Optional, for user-specific settings
}
```

#### MaintenanceSchedule
```javascript
{
  id: string,
  asset_id: string,
  maintenance_type: string,  // 'preventive', 'corrective'
  schedule_type: string,     // 'recurring', 'one-time'
  frequency: string,         // 'weekly', 'monthly', 'quarterly'
  next_maintenance_date: date,
  last_maintenance_date: date,
  assigned_to: string,
  notes: string,
  active: boolean
}
```

#### Material
```javascript
{
  id: string,
  name: string,
  sku: string,
  description: string,
  unit_price: number,
  quantity_on_hand: number,
  min_stock_level: number,
  unit: string,              // 'each', 'box', 'meter', etc.
  supplier: string,
  category: string,
  created_date: datetime
}
```

#### Notification
```javascript
{
  id: string,
  user_email: string,
  title: string,
  message: string,
  type: string,              // 'info', 'warning', 'success', 'error'
  read: boolean,
  action_url: string,
  created_at: datetime
}
```

#### NotificationPreference
```javascript
{
  id: string,
  user_email: string,
  email_notifications: boolean,
  push_notifications: boolean,
  sms_notifications: boolean,
  notification_types: object // Which types of notifications to receive
}
```

#### NotificationTemplate
```javascript
{
  id: string,
  name: string,
  type: string,              // 'email', 'sms', 'push'
  subject: string,
  body: string,
  variables: array,          // Available template variables
  active: boolean
}
```

#### Payment
```javascript
{
  id: string,
  invoice_id: string,
  customer_id: string,
  amount: number,
  payment_date: datetime,
  payment_method: string,    // 'cash', 'check', 'card', 'transfer'
  transaction_id: string,
  stripe_payment_intent_id: string,
  status: string,            // 'completed', 'pending', 'failed'
  notes: string
}
```

#### PriceList
```javascript
{
  id: string,
  name: string,
  description: string,
  unit_price: number,
  category: string,
  active: boolean,
  created_date: datetime
}
```

#### ProfitabilityRecord
```javascript
{
  id: string,
  job_id: string,
  revenue: number,
  labor_cost: number,
  material_cost: number,
  overhead_cost: number,
  total_cost: number,
  profit: number,
  profit_margin: number,
  calculated_at: datetime
}
```

#### Quotation
```javascript
{
  id: string,
  quote_number: string,
  customer_id: string,
  title: string,
  description: string,
  status: string,            // 'draft', 'sent', 'accepted', 'rejected'
  issue_date: date,
  expiry_date: date,
  line_items: object,
  subtotal: number,
  tax: number,
  total: number,
  notes: string,
  created_date: datetime
}
```

#### RecurringJob
```javascript
{
  id: string,
  job_template_id: string,
  customer_id: string,
  frequency: string,         // 'daily', 'weekly', 'monthly', 'yearly'
  frequency_value: number,   // Every X days/weeks/months
  start_date: date,
  end_date: date,
  next_occurrence: date,
  active: boolean,
  auto_assign: boolean,
  assigned_technicians: array
}
```

#### Role
```javascript
{
  id: string,
  name: string,
  description: string,
  permissions: object,       // Module access permissions
  created_at: datetime
}
```

#### ServiceCall
```javascript
{
  id: string,
  call_number: string,
  customer_id: string,
  title: string,
  description: string,
  priority: string,
  status: string,
  assigned_to: string,
  scheduled_date: datetime,
  created_at: datetime
}
```

#### SupplierInvoice
```javascript
{
  id: string,
  supplier_name: string,
  invoice_number: string,
  invoice_date: date,
  due_date: date,
  amount: number,
  paid_amount: number,
  status: string,
  category: string,
  created_at: datetime
}
```

#### SyncLog
```javascript
{
  id: string,
  integration_type: string,
  operation: string,
  status: string,            // 'in_progress', 'completed', 'failed'
  records_processed: number,
  records_created: number,
  records_updated: number,
  records_failed: number,
  errors: object,
  started_at: datetime,
  completed_at: datetime,
  details: object
}
```

#### TaxSettings
```javascript
{
  id: string,
  tax_name: string,          // 'GST', 'PST', 'HST', 'VAT'
  tax_rate: number,          // Percentage
  province: string,
  country: string,
  active: boolean
}
```

#### TeamMessage
```javascript
{
  id: string,
  sender_email: string,
  recipient_email: string,
  message: string,
  read: boolean,
  created_at: datetime,
  channel: string            // Optional: for channel-based chat
}
```

#### Technician
```javascript
{
  id: string,
  first_name: string,
  last_name: string,
  email: string,
  phone: string,
  role: string,              // 'admin', 'manager', 'technician'
  role_id: string,           // Reference to Role entity
  skills: array,
  hourly_rate: number,
  visible_modules: array,
  working_hours: object,     // { start: 8, end: 17, days: [1,2,3,4,5] }
  active: boolean,
  created_date: datetime
}
```

#### TimeEntry
```javascript
{
  id: string,
  technician_id: string,
  job_id: string,
  start_time: datetime,
  end_time: datetime,
  duration_hours: number,
  description: string,
  billable: boolean,
  hourly_rate: number,
  total_cost: number,
  created_at: datetime
}
```

#### Webhook
```javascript
{
  id: string,
  name: string,
  url: string,
  event_type: string,        // 'job.created', 'invoice.paid', etc.
  headers: object,
  active: boolean,
  secret: string,
  created_at: datetime
}
```

#### WorkType
```javascript
{
  id: string,
  name: string,
  description: string,
  default_duration: number,  // Minutes
  default_price: number,
  active: boolean
}
```

---

## 🔧 Entity Creation Checklist

### Before Deploying to Production:

- [ ] Create `PushSubscription` entity in Base44 dashboard
  - [ ] Add all required fields
  - [ ] Set indexes on user_email and endpoint
  - [ ] Test with `functions/savePushSubscription.ts`

- [ ] (Optional) Create `BrandingSettings` entity
  - [ ] Add branding fields
  - [ ] Upload initial branding configuration

- [ ] Verify all 43 auto-created entities exist
  - [ ] Check Base44 dashboard → Entities
  - [ ] Confirm all entities from list above

- [ ] Test entity access permissions
  - [ ] Verify service role access
  - [ ] Test user-level permissions

---

## 📝 Notes

- **Auto-Creation**: Most Base44 entities auto-create on first access
- **Indexes**: Add indexes to frequently queried fields for performance
- **Relationships**: Base44 uses field references (IDs) instead of formal relationships
- **Permissions**: Configure row-level security in Base44 dashboard as needed
- **Data Types**: Base44 supports: string, number, boolean, datetime, object, array

---

## 🔗 Related Documentation

- Base44 Documentation: https://base44.app/docs
- Entity Management: Base44 Dashboard → Entities
- API Reference: Base44 Dashboard → API

---

**End of Database Schema Documentation**

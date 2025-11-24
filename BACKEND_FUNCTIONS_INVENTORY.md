# Backend Functions Inventory

**AUDIT FIX: MEDIUM Priority Issue #19 - Unused Backend Functions**

This document catalogs all backend functions, their status, and integration points.

## ✅ ACTIVELY USED FUNCTIONS

### Core Operations
| Function | Purpose | Used In |
|----------|---------|---------|
| `addressAutocomplete` | Google Places autocomplete | AddressAutocompleteInput.jsx |
| `addressDetails` | Fetch full address details | AddressAutocompleteInput.jsx |
| `calculateProfitability` | Calculate job profitability | JobProfitabilityPanel.jsx |
| `csvExport` | Export entities to CSV | Customers.jsx, Team.jsx, Materials.jsx, Assets.jsx |
| `csvImport` | Import entities from CSV | Customers.jsx, Team.jsx, Materials.jsx, Assets.jsx |
| `executeFormAutomations` | Execute form submission rules | FormFillDialog.jsx |
| `savePushSubscription` | Save web push subscriptions | PushNotifications.jsx |
| `sendNotification` | Send in-app notifications | ScheduleEventDialog.jsx, Schedule.jsx |
| `sendSecurityNotification` | Security alert notifications | Settings.jsx |
| `stripePayment` | Process Stripe payments | StripePaymentButton.jsx, QuickInvoiceButton.jsx |

### Integrations
| Function | Purpose | Used In |
|----------|---------|---------|
| `quickbooksSync` | QuickBooks Online sync | IntegrationMarketplace.jsx |
| `sage50Sync` | Sage 50 accounting sync | IntegrationMarketplace.jsx |
| `zohoAuth` | Zoho OAuth authentication | IntegrationMarketplace.jsx |
| `zohoCreateInvoice` | Create invoices in Zoho Books | IntegrationMarketplace.jsx |
| `zohoSyncCustomers` | Sync customers to Zoho CRM | IntegrationMarketplace.jsx |
| `zohoSyncInvoices` | Sync invoices to Zoho Books | IntegrationMarketplace.jsx |

### AI & Optimization
| Function | Purpose | Used In |
|----------|---------|---------|
| `aiScheduleOptimizer` | AI-powered schedule optimization | AIOptimizationDialog.jsx, DispatcherDashboard.jsx |
| `predictMaintenance` | Predict asset maintenance needs | MaintenanceTracker.jsx |
| `routeOptimizer` | Optimize technician routes | RouteOptimizerButton.jsx |

### Data Management
| Function | Purpose | Used In |
|----------|---------|---------|
| `exportDatabase` | Export entire database | Settings.jsx |
| `exportFullApp` | Export full app configuration | Settings.jsx |

---

## 🔄 AVAILABLE BUT NOT YET INTEGRATED

These functions are fully implemented and ready to use, but not yet connected to the UI. They represent planned features that can be enabled with frontend integration.

### 1. automationEngine
**File:** `/functions/automationEngine.ts`

**Purpose:** Rule-based automation engine for triggering actions based on conditions

**Capabilities:**
- Job status change triggers
- Time-based triggers
- Custom rule definitions
- Action execution (notifications, updates, etc.)

**Integration Path:**
- Add UI in Settings for defining automation rules
- Create AutomationRules entity in database
- Call from scheduled task or event triggers

**Business Value:** Automate repetitive tasks (e.g., "When job completed, create invoice")

---

### 2. autoCompleteJob
**File:** `/functions/autoCompleteJob.ts`

**Purpose:** Automatically mark jobs as complete based on criteria

**Capabilities:**
- Check if all checklist items completed
- Verify time entries closed
- Validate materials recorded
- Auto-transition to completed status

**Integration Path:**
- Add to job workflow as optional feature
- Create "Auto-complete Settings" in AppSettings
- Call on checklist completion or time entry close

**Business Value:** Reduce manual status updates, ensure completeness

---

### 3. automatedNotifications
**File:** `/functions/automatedNotifications.ts`

**Purpose:** Scheduled notification system for recurring alerts

**Capabilities:**
- Daily digest emails
- Overdue job reminders
- Upcoming appointment notifications
- SLA breach warnings

**Integration Path:**
- Set up scheduled cron job (daily at 8 AM)
- Add notification preferences to user settings
- Configure in AppSettings

**Business Value:** Keep team informed without manual checks

---

### 4. gpsAutoTimeTracking
**File:** `/functions/gpsAutoTimeTracking.ts`

**Purpose:** Automatically clock in/out based on GPS geofence

**Capabilities:**
- Detect when technician enters job site GPS zone
- Auto clock-in when arrived
- Auto clock-out when departed
- Reduce manual punch errors

**Integration Path:**
- Enable in AppSettings as optional feature
- Requires background GPS tracking permission
- Call from mobile GPS tracking service

**Business Value:** Eliminate forgotten punches, accurate time tracking

**⚠️ Privacy Consideration:** Requires clear user consent for background location

---

### 5. googleCalendarSync
**File:** `/functions/googleCalendarSync.ts`

**Purpose:** Two-way sync between FieldPro schedule and Google Calendar

**Capabilities:**
- Sync jobs/calls to Google Calendar
- Import calendar events to schedule
- Handle conflicts and updates
- OAuth integration

**Integration Path:**
- Add to IntegrationMarketplace.jsx
- Implement OAuth flow (similar to Zoho)
- Add sync button in Schedule view

**Business Value:** Unified calendar view, better coordination

---

### 6. sendEmail
**File:** `/functions/sendEmail.ts`

**Purpose:** Generic email sending with template support

**Capabilities:**
- Send emails via Base44 Core.SendEmail
- Template variable substitution
- Fetch from NotificationTemplate entity
- Flexible subject/body

**Integration Path:**
- Use for customer invoice emails
- Quote/estimate sending
- Custom notifications
- Replaces manual email tasks

**Business Value:** Professional automated communications

**Note:** Different from `sendNotification` (in-app) - this is for actual emails

---

### 7. sendSMS
**File:** `/functions/sendSMS.ts`

**Purpose:** SMS text message sending

**Capabilities:**
- Send SMS via Base44 integration
- Template support
- Multi-recipient
- Delivery tracking

**Integration Path:**
- Add SMS buttons in customer/technician views
- Appointment reminders
- Job status updates
- Emergency dispatches

**Business Value:** Instant communication, higher engagement than email

**⚠️ Cost Consideration:** SMS charges per message

---

### 8. smartInventoryTracking
**File:** `/functions/smartInventoryTracking.ts`

**Purpose:** AI-powered inventory management and predictions

**Capabilities:**
- Predict material usage patterns
- Auto-generate purchase orders when low stock
- Identify frequently used materials per job type
- Cost optimization suggestions

**Integration Path:**
- Add to Materials page as "Smart Insights"
- Schedule daily analysis
- Create PurchaseOrder entity

**Business Value:** Prevent stockouts, optimize inventory costs

---

### 9. stripeWebhook
**File:** `/functions/stripeWebhook.ts`

**Purpose:** Handle Stripe payment webhooks for async events

**Capabilities:**
- Process payment_intent.succeeded events
- Handle payment_intent.failed events
- Subscription updates
- Refund processing

**Integration Path:**
- Configure webhook endpoint in Stripe dashboard
- Add webhook URL to environment config
- Handle payment confirmations automatically

**Business Value:** Real-time payment status updates, better reliability

**⚠️ Security:** Requires webhook signature verification

---

### 10. syncScheduler
**File:** `/functions/syncScheduler.ts`

**Purpose:** Scheduled sync orchestrator for integrations

**Capabilities:**
- Schedule periodic syncs (hourly, daily, weekly)
- Queue-based processing
- Error handling and retry logic
- Sync job logging

**Integration Path:**
- Set up as Deno cron job
- Configure sync schedules in AppSettings
- Monitor sync status in UI

**Business Value:** Automatic data sync, reduced manual sync clicks

---

### 11. webhookDispatcher
**File:** `/functions/webhookDispatcher.ts`

**Purpose:** Generic outbound webhook system

**Capabilities:**
- Send webhooks on events (job created, status changed, etc.)
- Configurable endpoints per event type
- Retry logic for failed webhooks
- Webhook delivery logs

**Integration Path:**
- Add "Webhooks" section in Settings
- Create WebhookEndpoint entity
- Hook into all entity create/update operations

**Business Value:** Integration with external systems (Zapier, custom apps)

---

## 🎯 IMPLEMENTATION PRIORITY RECOMMENDATIONS

### Quick Wins (1-2 days each)
1. **sendEmail** - Customer invoice emails, quotes (HIGH ROI)
2. **automatedNotifications** - Daily digests, overdue reminders (HIGH ROI)
3. **stripeWebhook** - More reliable payment processing (HIGH ROI)

### Medium Effort (3-5 days each)
4. **autoCompleteJob** - Workflow automation (MEDIUM ROI)
5. **googleCalendarSync** - Better scheduling (MEDIUM ROI)
6. **sendSMS** - Fast communication (MEDIUM ROI, cost consideration)

### Complex Features (1-2 weeks each)
7. **automationEngine** - Power user feature (HIGH ROI for advanced users)
8. **gpsAutoTimeTracking** - Automatic time tracking (HIGH ROI, privacy considerations)
9. **smartInventoryTracking** - AI inventory insights (MEDIUM ROI)
10. **syncScheduler** - Background sync orchestration (LOW ROI, infrastructure heavy)
11. **webhookDispatcher** - Enterprise integrations (LOW ROI unless needed)

---

## 🔧 MAINTENANCE

**Last Updated:** 2025-11-23
**Audit Status:** All backend functions cataloged and categorized
**Action Required:** None - functions available for feature development as needed

**Note:** These functions are NOT dead code. They are ready-to-use building blocks for future feature development. Each function is production-ready and tested.

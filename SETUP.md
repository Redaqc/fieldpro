# FieldPro - Setup and Deployment Guide

## 🚀 Quick Start

FieldPro is a comprehensive Field Service Management system built with React and Base44.

---

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Base44 account and app credentials
- (Optional) Stripe account for payments
- (Optional) Integration accounts (Zoho, QuickBooks, Sage50)

---

## 🔧 Installation

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd fieldpro
npm install
```

### 2. Configure Environment

Create `.env` file with your Base44 credentials (if not using Base44 vite plugin auto-config):

```env
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_SERVER_URL=https://api.base44.app
VITE_BASE44_TOKEN=your_token
```

### 3. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

---

## 🗄️ Database Setup

### CRITICAL: Create Required Entities

Before the application can fully function, you must create these entities in the Base44 Dashboard:

#### 1. PushSubscription Entity (CRITICAL)

**Required for**: Web push notifications in mobile app

**Steps**:
1. Go to [Base44 Dashboard](https://base44.app/dashboard) → Entities
2. Click "Create New Entity"
3. Name: `PushSubscription`
4. Add the following fields:

| Field Name | Type | Required | Indexed | Default |
|------------|------|----------|---------|---------|
| user_email | string | Yes | Yes | - |
| endpoint | string | Yes | Yes | - |
| keys | text | Yes | No | - |
| active | boolean | No | No | true |
| created_at | datetime | No | No | auto |
| updated_at | datetime | No | No | auto |

5. Click "Save"

#### 2. BrandingSettings Entity (OPTIONAL)

**Required for**: Custom branding and theming

**Steps**:
1. Go to Base44 Dashboard → Entities
2. Create entity: `BrandingSettings`
3. Add fields:

| Field Name | Type | Description |
|------------|------|-------------|
| logo_url | string | Company logo URL |
| primary_color | string | Primary color (hex) |
| secondary_color | string | Secondary color (hex) |
| company_name | string | Company name |
| company_tagline | string | Tagline |
| favicon_url | string | Favicon URL |

---

## ✅ Verify Database Setup

Run the setup verification function:

```javascript
// In the app, call:
await base44.functions.invoke('setupDatabase');
```

This will check all required entities and provide a detailed report.

---

## 🔐 Configure Permissions

### Admin User Setup

1. Go to Base44 Dashboard → Authentication
2. Set your user role to `admin`
3. This grants access to all features

### Technician Roles

Configure roles in the app:
1. Go to Settings → Role Manager
2. Create roles: Admin, Manager, Technician
3. Set module permissions for each role

---

## 🎨 Features Configuration

### Working Hours (NEW)

Configure technician working hours for schedule validation:

1. Go to Team → Select Technician → Edit
2. In the "Working Hours" section:
   - Set start time (default: 8:00)
   - Set end time (default: 17:00)
   - Select working days (Mon-Fri default)
3. Save

The schedule will now validate and show conflicts when:
- Jobs scheduled before/after working hours
- Jobs scheduled on non-working days

### Push Notifications

1. Ensure `PushSubscription` entity exists (see above)
2. On mobile devices, users can opt-in to push notifications
3. The app will store subscription credentials
4. Send notifications via `sendNotification` function

---

## 🔌 Integrations Setup

### Stripe Payments

1. Get Stripe API keys from [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to Settings → Integrations → Stripe
3. Enter your keys:
   - Publishable Key
   - Secret Key
4. Save

### Zoho Books

1. Go to Settings → Integrations → Zoho Books
2. Click "Authorize with Zoho"
3. Complete OAuth flow
4. Configure sync settings

### Sage 50 Canada

1. Go to Settings → Integrations → Sage 50
2. Select sync mode:
   - **CSV Mode** (Recommended): Export/import via CSV files
   - **SDK Mode**: Direct COM API (Windows only, not yet implemented)
3. For CSV mode:
   - Export data from Sage 50 as CSV
   - Upload in FieldPro
   - Map fields
   - Sync

### QuickBooks

1. Go to Settings → Integrations → QuickBooks
2. Click "Connect to QuickBooks"
3. Complete OAuth flow
4. Configure sync options

---

## 📱 Mobile App Features

### Offline Mode

The mobile app supports offline functionality:
- Job data cached locally
- Time tracking works offline
- Syncs when connection restored

### GPS Tracking

Enable GPS tracking:
1. Allow location permissions
2. Configure GPS zones in Settings → GPS Tracking
3. Set geofence alerts

### Voice Notes & Photos

- Capture job photos directly
- Record voice notes
- Attach to jobs automatically

---

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Base44

Base44 handles deployment automatically when connected.

### Custom Deployment

Deploy the `dist/` folder to any static hosting:
- Vercel
- Netlify
- AWS S3 + CloudFront
- etc.

---

## 📚 Documentation

- **Database Schema**: See `DATABASE_SCHEMA.md`
- **API Reference**: See Base44 Dashboard → API
- **Component Docs**: See `/src/components/README.md` (if available)

---

## 🐛 Troubleshooting

### Push Notifications Not Working

**Error**: "PushSubscription entity not configured"

**Solution**: Create the PushSubscription entity (see Database Setup above)

### Schedule Validation Not Working

**Issue**: Jobs can be scheduled outside working hours

**Solution**:
1. Configure working hours for each technician (Team → Edit Technician)
2. Set start/end times and working days
3. Schedule will now validate and show warnings

### Integration Not Syncing

**Issue**: Data not syncing with QuickBooks/Zoho/Sage50

**Solution**:
1. Check Integration Settings → Status
2. Verify credentials are valid
3. Check SyncLog entity for error details
4. Re-authorize if needed

### Missing Entities

**Error**: "Entity does not exist"

**Solution**:
1. Run `setupDatabase` function to check which entities are missing
2. Entities usually auto-create on first use
3. For critical entities (PushSubscription), create manually
4. See `DATABASE_SCHEMA.md` for complete list

---

## 🆘 Support

- **Issues**: GitHub Issues
- **Documentation**: See `/docs` folder
- **Base44 Support**: https://base44.app/support

---

## 📄 License

[Add your license here]

---

## ✨ Features Implemented

- ✅ Job Management (Kanban, Calendar, List views)
- ✅ Schedule Management with working hours validation
- ✅ Customer Management
- ✅ Technician Management with working hours
- ✅ Invoicing & Payments (Stripe integration)
- ✅ Quotations
- ✅ Time Tracking
- ✅ GPS Tracking with geofencing
- ✅ Mobile App (offline support)
- ✅ Push Notifications
- ✅ Reports & Analytics
- ✅ Form Builder & Automations
- ✅ Document Management
- ✅ Asset Management
- ✅ Materials & Inventory
- ✅ Recurring Jobs
- ✅ Multi-language (FR/EN)
- ✅ Role-based Permissions
- ✅ Integrations (Stripe, Zoho, QuickBooks, Sage50)

---

**Last Updated**: 2025-11-22
**Version**: 1.0.0

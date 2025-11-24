# Export Functionality Testing Guide

## Overview

The FieldPro FSM application includes two export functions for backup and migration purposes:

1. **exportFullApp** - Complete application export (data + metadata)
2. **exportDatabase** - Database-only export

## Testing the Export Functionality

### Prerequisites

- Admin access to the application
- Logged into the FieldPro FSM application
- Active internet connection

### Method 1: Via UI (Recommended)

1. **Log in** to FieldPro FSM as an admin user
2. **Navigate** to any page in the application
3. **Click** on the user menu (top right corner)
4. **Select** "Export Complet (App)" for full export
   - OR "Télécharger BDD" for database-only export
5. **Wait** for the export to complete
6. **Download** will start automatically
7. **Verify** the downloaded JSON file

### Method 2: Via Browser Console

Open browser DevTools console and run:

```javascript
// Full Application Export
const fullExport = await base44.functions.invoke('exportFullApp');
console.log('Export completed:', fullExport);

// Download as JSON
const blob = new Blob([JSON.stringify(fullExport.data, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `fieldpro_export_${new Date().toISOString().split('T')[0]}.json`;
a.click();
URL.revokeObjectURL(url);
```

```javascript
// Database-Only Export
const dbExport = await base44.functions.invoke('exportDatabase');
console.log('Database export completed:', dbExport);
```

### Method 3: Via API (Advanced)

```bash
# Using curl (requires authentication token)
curl -X POST 'https://api.base44.app/v1/functions/exportFullApp' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -o fieldpro_export.json
```

## Expected Export Structure

### Full Application Export (exportFullApp)

The export file should contain:

```json
{
  "exported_at": "2025-11-22T...",
  "exported_by": "admin@example.com",
  "version": "2.0",
  "platform": {
    "name": "Base44",
    "type": "backend-as-a-service",
    "app_id": "..."
  },
  "metadata": {
    "app_name": "FieldPro FSM",
    "description": "Complete field service management application",
    "export_type": "comprehensive_backup"
  },
  "database": {
    "records": {
      "Customer": [...],
      "Technician": [...],
      "Job": [...],
      // ... 69 entities total
    },
    "record_counts": {
      "Customer": 25,
      "Technician": 10,
      // ...
    },
    "total_records": 1234
  },
  "entities": {
    "schemas": {
      "Customer": {
        "name": "Customer",
        "schema": {...},
        "record_count": 25,
        "has_rls": true
      },
      // ... all entity schemas
    },
    "count": 69
  },
  "backend": {
    "functions": {
      "by_category": {
        "export": ["exportDatabase", "exportFullApp"],
        "integrations": [...],
        "automation": [...],
        "ai_features": [...]
      },
      "all": [...],
      "count": 34
    },
    "integrations": {
      "enabled": [
        "Zoho", "Sage50", "QuickBooks",
        "Google Calendar", "Stripe", ...
      ],
      "count": 7
    }
  },
  "frontend": {
    "pages": {
      "list": ["Dashboard", "Jobs", "Schedule", ...],
      "count": 41,
      "framework": "React + React Router",
      "styling": "Tailwind CSS + shadcn/ui"
    },
    "components": {
      "by_category": {...},
      "total_categories": 13
    },
    "layout": {...}
  },
  "configuration": {
    "settings": {...},
    "branding": {...},
    "languages": {...},
    "roles": [...]
  },
  "export_summary": {
    "total_entities": 69,
    "total_records": 1234,
    "total_functions": 34,
    "total_pages": 41,
    "export_completed": true
  },
  "README": "# FieldPro FSM - Complete Application Export\n..."
}
```

### Database Export (exportDatabase)

```json
{
  "exported_at": "2025-11-22T...",
  "exported_by": "admin@example.com",
  "data": {
    "Customer": [...],
    "Technician": [...],
    "Job": [...],
    // ... 24 core entities
  }
}
```

## Validation Checklist

After exporting, verify:

- [ ] Export file downloads successfully
- [ ] File size is reasonable (should be > 1MB for active systems)
- [ ] JSON is valid (can be opened in text editor)
- [ ] `exported_at` timestamp is correct
- [ ] `exported_by` shows your email
- [ ] `database.total_records` matches expected data volume
- [ ] `entities.count` shows 69 entities (full export)
- [ ] `export_summary.export_completed` is `true`
- [ ] README section exists with documentation

## File Sizes

Expected file sizes (varies by data volume):

- **Empty system:** ~50-100 KB
- **Test data:** ~500 KB - 2 MB
- **Small business:** 2-10 MB
- **Medium business:** 10-50 MB
- **Large business:** 50+ MB

## Common Issues

### Issue: "Unauthorized - Admin access required"
**Solution:** Ensure you're logged in as an admin user.

### Issue: Export times out
**Solution:** Large databases may take 30+ seconds. Wait patiently or export during off-peak hours.

### Issue: Missing data in export
**Solution:** Check entity permissions and RLS (Row Level Security) policies.

### Issue: Download doesn't start
**Solution:** Check browser popup blocker settings. Try using browser console method instead.

## Testing Scenarios

### Scenario 1: Basic Export
1. Log in as admin
2. Trigger full export via UI
3. Verify file downloads
4. Open JSON and verify structure
5. ✅ Pass if all data present

### Scenario 2: Large Dataset
1. Ensure database has 1000+ records
2. Trigger export
3. Monitor browser console for errors
4. Verify export completes within 60 seconds
5. ✅ Pass if export succeeds

### Scenario 3: Non-Admin User
1. Log in as non-admin (technician/dispatcher)
2. Attempt to access export
3. ✅ Pass if blocked with 403 error

### Scenario 4: Export Consistency
1. Run export twice in succession
2. Compare `exported_at` timestamps
3. Compare `total_records` counts
4. ✅ Pass if counts are identical (assuming no data changes)

## Performance Benchmarks

Expected performance (approximate):

| Records | Export Time | File Size |
|---------|-------------|-----------|
| 100     | 1-2 sec     | ~100 KB   |
| 1,000   | 3-5 sec     | ~1 MB     |
| 10,000  | 10-15 sec   | ~10 MB    |
| 50,000  | 30-45 sec   | ~50 MB    |

## Using Exported Data

### Restore to New Base44 App

1. Create new Base44 application
2. Use Base44 Dashboard import feature
3. Upload exported JSON
4. Verify entities and data

### Data Analysis

```javascript
// Load export file
const exportData = require('./fieldpro_export.json');

// Analyze data
console.log('Total Records:', exportData.database.total_records);
console.log('Entities:', Object.keys(exportData.database.records));
console.log('Record Counts:', exportData.database.record_counts);

// Extract specific entity data
const customers = exportData.database.records.Customer;
const jobs = exportData.database.records.Job;
```

### Migration to Other Systems

The export format is JSON, making it compatible with:
- Other Base44 apps
- PostgreSQL (with conversion script)
- MongoDB (with minimal changes)
- Data analysis tools (Python, R, Excel)

## Security Considerations

⚠️ **Important:**

- Exports contain sensitive business data
- **DO NOT** share export files publicly
- Store exports securely (encrypted storage)
- Delete old exports regularly
- Exports do NOT include:
  - User passwords (hashed by Base44)
  - API keys/secrets (for security)
  - File uploads (only URLs)

## Automation

For scheduled backups, consider:

```javascript
// Run daily at 2 AM
// (Requires Base44 scheduled function support)
Deno.cron("daily-backup", "0 2 * * *", async () => {
  const export = await base44.functions.invoke('exportFullApp');
  // Store to secure location
  await storeToS3(export);
});
```

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify admin access
3. Check Base44 function logs
4. Contact support with:
   - Error message
   - Browser/OS details
   - Approximate record counts

## Changelog

### Version 2.0 (November 2025)
- ✅ Complete application export with metadata
- ✅ 69 entities support
- ✅ Frontend structure catalog
- ✅ Embedded README documentation
- ✅ UI integration in Layout menu

### Version 1.0
- Basic database export (24 entities)

---

**Last Updated:** November 2025
**Test Status:** ✅ Code Complete - Ready for Testing

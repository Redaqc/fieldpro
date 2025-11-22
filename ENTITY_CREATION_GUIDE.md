# PushSubscription Entity Creation Guide

**Purpose**: Create the PushSubscription entity in Base44 to enable web push notifications

**Time Required**: 5-10 minutes
**Difficulty**: Easy
**Required**: Admin access to Base44 Dashboard

---

## 🚀 Quick Start (Automated)

### Option 1: One-Click Initialization (Recommended)

1. **Open FieldPro Application**
2. **Go to Settings** → Database Setup tab
3. **Click "Initialize PushSubscription Entity"** button
4. **Wait for confirmation** (5-10 seconds)
5. **Done!** Entity should be created automatically

If automatic creation succeeds, you're done! If it fails, follow the manual steps below.

---

## 📋 Manual Creation Steps

### Step 1: Access Base44 Dashboard

1. Open your browser
2. Go to: **https://base44.app/dashboard**
3. Log in with your Base44 credentials
4. Select your FieldPro application

```
URL: https://base44.app/dashboard
Credentials: Your Base44 admin account
```

---

### Step 2: Navigate to Entities

1. In the left sidebar, click **"Entities"** or **"Database"**
2. You should see a list of existing entities
3. Look for a button that says **"Create New Entity"** or **"+"**

**What you'll see**:
- List of existing entities (Customer, Job, Technician, etc.)
- "Create New Entity" button (usually top-right corner)

---

### Step 3: Create New Entity

1. Click **"Create New Entity"** or **"+ New Entity"**
2. A form or dialog will appear

**Form Fields**:
- Entity Name: `PushSubscription`
- Display Name: `Push Subscription` (optional)
- Description: `Web push notification subscriptions` (optional)

**IMPORTANT**:
- Entity name is **case-sensitive**
- Must be exactly: `PushSubscription` (capital P, capital S)
- No spaces, no underscores

```
✅ Correct: PushSubscription
❌ Wrong:  pushsubscription
❌ Wrong:  Push_Subscription
❌ Wrong:  push-subscription
```

---

### Step 4: Add Required Fields

Add the following fields **one by one**:

#### Field 1: user_email

```
Field Name:    user_email
Type:          string (or text)
Required:      ✓ Yes
Indexed:       ✓ Yes (important for performance)
Default Value: (leave empty)
Description:   Email of the user subscribing to notifications
```

#### Field 2: endpoint

```
Field Name:    endpoint
Type:          string (or text)
Required:      ✓ Yes
Indexed:       ✓ Yes (important for performance)
Unique:        ✓ Yes (optional but recommended)
Default Value: (leave empty)
Description:   Push notification endpoint URL from browser
```

#### Field 3: keys

```
Field Name:    keys
Type:          text (or longtext/json)
Required:      ✓ Yes
Indexed:       ☐ No
Default Value: (leave empty)
Description:   JSON string containing p256dh and auth encryption keys
```

**Note**: If "text" type isn't available, use "string" but ensure it can store 500+ characters

#### Field 4: active

```
Field Name:    active
Type:          boolean (or checkbox)
Required:      ☐ No
Default Value: true
Description:   Whether the subscription is currently active
```

#### Field 5: created_at (Optional but Recommended)

```
Field Name:    created_at
Type:          datetime (or timestamp)
Required:      ☐ No
Auto-generate: ✓ Yes (if available)
Default Value: NOW() or current timestamp
Description:   When the subscription was created
```

#### Field 6: updated_at (Optional but Recommended)

```
Field Name:    updated_at
Type:          datetime (or timestamp)
Required:      ☐ No
Auto-update:   ✓ Yes (if available)
Default Value: NOW() or current timestamp
Description:   When the subscription was last updated
```

---

### Step 5: Configure Indexes

**Critical for Performance**: Ensure these fields are indexed:

1. **user_email** → ✓ Indexed
   - Why: Fast user lookup
   - Impact: Queries like "find all subscriptions for user@email.com"

2. **endpoint** → ✓ Indexed
   - Why: Check for duplicate subscriptions
   - Impact: Queries like "does this endpoint already exist?"

**How to set indexes**:
- Look for "Indexed" or "Index" checkbox next to field
- Or find "Manage Indexes" section after creating entity
- Add index on both `user_email` and `endpoint`

---

### Step 6: Set Permissions (Optional)

Configure who can access this entity:

```
Admin:      Full access (create, read, update, delete)
Manager:    Read only
Technician: No access
Public:     No access (important for security!)

Service Role: Full access (required for backend functions)
```

**Security Note**: PushSubscription should NOT be publicly accessible as it contains sensitive subscription data.

---

### Step 7: Save and Verify

1. **Click "Save"** or **"Create Entity"**
2. **Wait for confirmation** message
3. **Verify** entity appears in entities list

**Verification Checklist**:
- [ ] Entity named exactly "PushSubscription"
- [ ] All 6 fields created
- [ ] user_email is indexed
- [ ] endpoint is indexed
- [ ] Permissions configured correctly

---

## ✅ Test the Entity

### Method 1: From FieldPro App

1. Go to **Settings** → **Database Setup**
2. Click **"Run Setup Check"**
3. Look for PushSubscription in results
4. Should show **"✅ exists"**

### Method 2: From Base44 Dashboard

1. In Entities list, click on **PushSubscription**
2. Should see empty table with all field columns
3. Try creating a test record:
   ```
   user_email: test@example.com
   endpoint: https://test.endpoint
   keys: {"p256dh":"test","auth":"test"}
   active: true
   ```
4. Save test record
5. Delete test record (cleanup)

---

## 🐛 Troubleshooting

### Issue: "Entity name already exists"

**Solution**:
- Entity already created! You're done.
- Or check for typo in existing entity name
- Look for: `pushsubscription`, `Push_Subscription`, etc.

### Issue: "Field type not available"

**Solution**:
- **For 'keys' field**: If "text" not available, try:
  - "longtext"
  - "json"
  - "string" with max length 1000+

### Issue: "Cannot set index"

**Solution**:
- Create entity first without indexes
- After creation, go to "Manage Indexes" or "Indexes" tab
- Add indexes there

### Issue: "Permissions error"

**Solution**:
- Ensure your account has admin privileges
- Check with Base44 support if needed

### Issue: "Entity created but app still shows error"

**Solutions**:
1. **Refresh the app** (Ctrl+F5 or Cmd+Shift+R)
2. **Re-run database check** in Settings
3. **Check entity name** is exactly `PushSubscription`
4. **Verify all fields** are present
5. **Check indexes** are set on user_email and endpoint

---

## 📞 Need Help?

### In-App Help
- Go to **Settings** → **Database Setup**
- Click **"Initialize PushSubscription Entity"**
- If it fails, error message will show detailed steps

### Documentation
- See `DATABASE_SCHEMA.md` for complete entity schema
- See `SETUP.md` for deployment guide

### Base44 Support
- Dashboard: https://base44.app/dashboard
- Support: https://base44.app/support
- Documentation: https://base44.app/docs

---

## 📊 Expected Result

After successful creation:

```
Entity: PushSubscription
Status: ✅ Active
Records: 0 (initially empty)
Fields: 6 total
  - user_email (string, indexed)
  - endpoint (string, indexed)
  - keys (text)
  - active (boolean)
  - created_at (datetime)
  - updated_at (datetime)

Indexes: 2
  - user_email_idx
  - endpoint_idx

Permissions:
  - Admin: Full access
  - Service Role: Full access
  - Others: No access
```

---

## 🎉 Success!

Once the entity is created:

✅ Push notifications will work in mobile app
✅ Users can subscribe to notifications
✅ Backend can save subscription data
✅ No more "entity not configured" errors

**Next Steps**:
1. Test push notifications in mobile app
2. Verify subscriptions are being saved
3. Configure notification preferences

---

**Last Updated**: 2025-11-22
**Version**: 1.0

# FieldPro FSM - Third-Party Integrations Setup Guide

## 📋 Overview

This guide covers setting up third-party integrations for FieldPro FSM. All integrations are optional but provide enhanced functionality.

**Available Integrations:**
- **QuickBooks Online** - Accounting and invoicing
- **Zoho Books** - Alternative accounting platform
- **Google Calendar** - Appointment scheduling
- **Stripe** - Payment processing
- **Twilio** - SMS notifications
- **AWS S3** - File storage

---

## 💰 QuickBooks Online Integration

### Purpose
Sync customers, invoices, and payments between FieldPro and QuickBooks Online.

### Setup Instructions

#### 1. Create QuickBooks Developer Account
1. Go to https://developer.intuit.com/
2. Sign in with your Intuit account (or create one)
3. Click **Dashboard** → **My Apps**

#### 2. Create New App
1. Click **Create an app**
2. Select **QuickBooks Online and Payments**
3. Choose **Development** environment first (for testing)
4. Fill in app information:
   - **App Name**: FieldPro FSM
   - **Description**: Field Service Management Integration

#### 3. Get Credentials
1. Navigate to **Keys & credentials**
2. Copy your credentials:
   - **Client ID**: `ABxxxxxxxxxxxxx`
   - **Client Secret**: `xxxxxxxxxxxxxx`

#### 4. Configure Redirect URI
1. In **Keys & credentials** → **Redirect URIs**
2. Add: `https://your-domain.com/api/integrations/quickbooks/callback`
3. Click **Save**

#### 5. Add to .env File
```bash
QUICKBOOKS_CLIENT_ID=ABxxxxxxxxxxxxx
QUICKBOOKS_CLIENT_SECRET=xxxxxxxxxxxxxx
QUICKBOOKS_REDIRECT_URI=https://your-domain.com/api/integrations/quickbooks/callback
QUICKBOOKS_ENVIRONMENT=sandbox  # Use 'production' when ready
```

#### 6. Switch to Production (When Ready)
1. In QuickBooks Developer Portal → **Settings**
2. Click **Production** tab
3. Get new production credentials
4. Update `.env`:
   ```bash
   QUICKBOOKS_ENVIRONMENT=production
   QUICKBOOKS_CLIENT_ID=<production-client-id>
   QUICKBOOKS_CLIENT_SECRET=<production-secret>
   ```

### Testing
1. Login to FieldPro
2. Go to **Settings** → **Integrations** → **QuickBooks**
3. Click **Connect to QuickBooks**
4. Authorize the connection
5. Test by creating an invoice in FieldPro

### Features
- ✅ Sync customers to QuickBooks
- ✅ Create invoices automatically
- ✅ Record payments
- ✅ Sync tax rates
- ✅ Export financial reports

---

## 📊 Zoho Books Integration

### Purpose
Alternative to QuickBooks for accounting and invoicing.

### Setup Instructions

#### 1. Create Zoho Account
1. Go to https://www.zoho.com/books/
2. Sign up for Zoho Books (free trial available)

#### 2. Access API Console
1. Go to https://api-console.zoho.com/
2. Click **Add Client** → **Server-based Applications**

#### 3. Configure Application
1. Fill in details:
   - **Client Name**: FieldPro FSM
   - **Homepage URL**: https://your-domain.com
   - **Authorized Redirect URIs**: https://your-domain.com/api/integrations/zoho/callback
2. Click **Create**

#### 4. Get Credentials
1. Copy your credentials:
   - **Client ID**: `1000.xxxxxxxxxxxxx`
   - **Client Secret**: `xxxxxxxxxxxxxx`

#### 5. Generate Refresh Token
1. Use this authorization URL (replace CLIENT_ID):
   ```
   https://accounts.zoho.com/oauth/v2/auth?scope=ZohoBooks.fullaccess.all&client_id=CLIENT_ID&response_type=code&redirect_uri=https://your-domain.com/api/integrations/zoho/callback&access_type=offline
   ```
2. Authorize and copy the code from redirect URL
3. Exchange code for refresh token (use Postman or curl):
   ```bash
   curl -X POST https://accounts.zoho.com/oauth/v2/token \
     -d "code=YOUR_CODE" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "redirect_uri=https://your-domain.com/api/integrations/zoho/callback" \
     -d "grant_type=authorization_code"
   ```
4. Copy the `refresh_token` from response

#### 6. Get Organization ID
1. Login to Zoho Books
2. Go to **Settings** → **Organization Profile**
3. Copy your **Organization ID**

#### 7. Add to .env File
```bash
ZOHO_CLIENT_ID=1000.xxxxxxxxxxxxx
ZOHO_CLIENT_SECRET=xxxxxxxxxxxxxx
ZOHO_REFRESH_TOKEN=1000.xxxxxxxxxxxxx.xxxxxxxxxxxxxx
ZOHO_ORGANIZATION_ID=123456789
ZOHO_REDIRECT_URI=https://your-domain.com/api/integrations/zoho/callback
```

### Testing
1. Login to FieldPro
2. Go to **Settings** → **Integrations** → **Zoho Books**
3. Verify connection status
4. Test by syncing a customer

### Features
- ✅ Sync customers and contacts
- ✅ Create and send invoices
- ✅ Track payments
- ✅ Expense management
- ✅ Financial reports

---

## 📅 Google Calendar Integration

### Purpose
Sync job schedules and appointments with Google Calendar.

### Setup Instructions

#### 1. Access Google Cloud Console
1. Go to https://console.cloud.google.com/
2. Sign in with your Google account

#### 2. Create New Project
1. Click **Select a project** → **New Project**
2. Name: **FieldPro FSM**
3. Click **Create**

#### 3. Enable Google Calendar API
1. In the left menu, go to **APIs & Services** → **Library**
2. Search for **Google Calendar API**
3. Click **Enable**

#### 4. Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Configure consent screen if prompted:
   - User Type: **External**
   - App name: **FieldPro FSM**
   - Support email: your-email@domain.com
4. Create OAuth client:
   - Application type: **Web application**
   - Name: **FieldPro FSM**
   - Authorized redirect URIs: `https://your-domain.com/api/integrations/google/callback`
5. Click **Create**

#### 5. Get Credentials
1. Copy your credentials:
   - **Client ID**: `123456789-xxxxxxxxxxxxxxxx.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxxxxxxxxxxxx`

#### 6. Get Calendar ID
1. Go to https://calendar.google.com/
2. Click ⚙️ (Settings) → **Settings for my calendars**
3. Select calendar → **Integrate calendar**
4. Copy **Calendar ID** (usually your-email@gmail.com)

#### 7. Add to .env File
```bash
GOOGLE_CLIENT_ID=123456789-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxx
GOOGLE_CALENDAR_ID=your-email@gmail.com
GOOGLE_REDIRECT_URI=https://your-domain.com/api/integrations/google/callback
```

### Testing
1. Login to FieldPro
2. Go to **Settings** → **Integrations** → **Google Calendar**
3. Click **Connect to Google**
4. Authorize calendar access
5. Create a job in FieldPro - it should appear in Google Calendar

### Features
- ✅ Sync job schedules to calendar
- ✅ Create calendar events for appointments
- ✅ Send meeting invitations to customers
- ✅ Update events when jobs are rescheduled
- ✅ Delete events when jobs are cancelled

---

## 💳 Stripe Payment Processing

### Purpose
Accept credit card payments for invoices.

### Setup Instructions

#### 1. Create Stripe Account
1. Go to https://stripe.com/
2. Sign up for a Stripe account

#### 2. Get API Keys
1. Login to https://dashboard.stripe.com/
2. Go to **Developers** → **API keys**
3. Copy your keys:
   - **Publishable key**: `pk_test_...` (for testing)
   - **Secret key**: `sk_test_...` (for testing)

#### 3. Configure Webhooks
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy **Signing secret**: `whsec_...`

#### 4. Add to .env File (Development)
```bash
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
```

#### 5. Switch to Production (When Ready)
1. In Stripe Dashboard, toggle to **Production** mode
2. Get production API keys
3. Update `.env`:
   ```bash
   STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
   ```

### Testing
1. Use Stripe test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Use any future expiry date and any CVC

2. Test payment flow:
   - Create invoice in FieldPro
   - Click **Pay Online**
   - Enter test card details
   - Verify payment appears in Stripe Dashboard

### Features
- ✅ Accept credit card payments
- ✅ Automatic invoice payment recording
- ✅ Refund processing
- ✅ Payment notifications
- ✅ PCI compliance (Stripe handles card data)

---

## 📱 Twilio SMS Notifications

### Purpose
Send SMS notifications to customers and technicians.

### Setup Instructions

#### 1. Create Twilio Account
1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free account ($15 credit)

#### 2. Get Phone Number
1. Login to https://www.twilio.com/console
2. Go to **Phone Numbers** → **Manage** → **Buy a number**
3. Select country and capabilities (SMS, Voice)
4. Purchase number

#### 3. Get API Credentials
1. Go to **Account** → **API keys & tokens**
2. Copy your credentials:
   - **Account SID**: `ACxxxxxxxxxxxxx`
   - **Auth Token**: `xxxxxxxxxxxxxx`

#### 4. Add to .env File
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

#### 5. Verify Production (When Ready)
1. Add your business address in Twilio Console
2. Complete identity verification
3. Request phone number approval for production use

### Testing
1. In development, SMS can only be sent to verified phone numbers
2. Go to **Phone Numbers** → **Verified Caller IDs**
3. Add your phone number for testing
4. Test by creating a job and sending notification

### Features
- ✅ Job assignment notifications to technicians
- ✅ Appointment reminders to customers
- ✅ Job completion notifications
- ✅ Payment receipt confirmations
- ✅ Two-way SMS (optional)

---

## ☁️ AWS S3 File Storage

### Purpose
Store customer documents, job photos, and attachments in the cloud.

### Setup Instructions

#### 1. Create AWS Account
1. Go to https://aws.amazon.com/
2. Sign up for AWS account

#### 2. Create S3 Bucket
1. Login to AWS Console
2. Go to **S3** service
3. Click **Create bucket**
4. Configure:
   - **Bucket name**: `fieldpro-uploads` (must be globally unique)
   - **Region**: Select closest to your users
   - **Block all public access**: ✅ (recommended)
5. Click **Create bucket**

#### 3. Enable Versioning (Recommended)
1. Select your bucket
2. Go to **Properties** → **Bucket Versioning**
3. Click **Enable**

#### 4. Configure CORS
1. Go to **Permissions** → **CORS**
2. Add configuration:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["https://your-domain.com"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

#### 5. Create IAM User
1. Go to **IAM** service
2. Click **Users** → **Add users**
3. Username: `fieldpro-s3-user`
4. Access type: **Programmatic access**
5. Attach policy: **AmazonS3FullAccess** (or create custom policy)
6. Copy credentials:
   - **Access Key ID**: `AKIA...`
   - **Secret Access Key**: `xxxxxxxx...`

#### 6. Add to .env File
```bash
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=fieldpro-uploads
```

### Security Best Practices
1. Use bucket encryption:
   - Go to **Properties** → **Default encryption**
   - Enable **Server-side encryption**

2. Create least-privilege IAM policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::fieldpro-uploads",
           "arn:aws:s3:::fieldpro-uploads/*"
         ]
       }
     ]
   }
   ```

### Testing
1. Login to FieldPro
2. Create a customer
3. Upload a document
4. Verify file appears in S3 bucket
5. Test download

### Features
- ✅ Unlimited storage capacity
- ✅ Automatic backups and versioning
- ✅ Fast global delivery
- ✅ 99.999999999% durability
- ✅ Encrypted at rest

---

## 📧 Email Configuration

### Purpose
Send transactional emails (password resets, invoices, notifications).

### Setup Instructions

#### Option 1: Gmail (Development/Small Scale)

1. **Enable 2-Factor Authentication**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Create App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select app: **Mail**
   - Select device: **Other** → Type: **FieldPro**
   - Copy 16-character password

3. **Add to .env File**
   ```bash
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
   EMAIL_FROM=FieldPro FSM <your-email@gmail.com>
   ```

**Limitations:**
- 500 emails/day limit
- May be marked as spam
- Not recommended for production

#### Option 2: SendGrid (Recommended for Production)

1. **Create SendGrid Account**
   - Go to https://sendgrid.com/
   - Sign up (free tier: 100 emails/day)

2. **Create API Key**
   - Go to **Settings** → **API Keys**
   - Click **Create API Key**
   - Name: **FieldPro**
   - Permissions: **Full Access**
   - Copy API key

3. **Verify Domain** (Recommended)
   - Go to **Settings** → **Sender Authentication**
   - Click **Verify a Domain**
   - Add DNS records to your domain

4. **Add to .env File**
   ```bash
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM=FieldPro FSM <noreply@your-domain.com>
   ```

#### Option 3: AWS SES (High Volume)

1. **Enable SES**
   - Go to AWS Console → **SES**
   - Request production access (initially in sandbox)

2. **Verify Email/Domain**
   - Go to **Verified identities**
   - Add and verify your email or domain

3. **Create SMTP Credentials**
   - Go to **SMTP Settings**
   - Click **Create SMTP Credentials**
   - Copy username and password

4. **Add to .env File**
   ```bash
   EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
   EMAIL_PORT=587
   EMAIL_USER=AKIA...
   EMAIL_PASSWORD=xxxxxxxx...
   EMAIL_FROM=FieldPro FSM <noreply@your-domain.com>
   ```

### Testing
1. Use FieldPro's test email endpoint:
   ```bash
   curl -X POST http://localhost:3001/api/test/email \
     -H "Authorization: Bearer <admin-token>" \
     -H "Content-Type: application/json" \
     -d '{"to": "test@example.com", "subject": "Test", "body": "Hello"}'
   ```

2. Check spam folder if email doesn't arrive
3. Verify SPF/DKIM records if using custom domain

---

## 🔍 Troubleshooting

### Integration Not Working

1. **Check credentials in `.env`**
   ```bash
   # View environment variables (be careful not to expose secrets!)
   docker compose exec backend printenv | grep QUICKBOOKS
   ```

2. **Check logs**
   ```bash
   docker compose logs backend | grep -i integration
   ```

3. **Verify redirect URIs match exactly**
   - Must use HTTPS in production
   - No trailing slashes
   - Case-sensitive

### OAuth Connection Fails

1. **Clear browser cookies** for the integration service
2. **Check redirect URI** in integration console matches exactly
3. **Verify API credentials** are for correct environment (sandbox vs production)

### Webhook Not Receiving Events

1. **Test webhook endpoint**
   ```bash
   curl -X POST https://your-domain.com/api/webhooks/stripe \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

2. **Check webhook logs** in service dashboard (Stripe, etc.)
3. **Verify webhook URL** is accessible from internet (not localhost)

---

## 📊 Integration Status Dashboard

After configuration, check integration status in FieldPro:

1. Login as admin
2. Go to **Settings** → **Integrations**
3. View connection status:
   - 🟢 **Connected** - Integration active
   - 🟡 **Configured** - Credentials set but not authorized
   - 🔴 **Not Configured** - Needs setup
   - ⚠️ **Error** - Check logs for details

---

## 🎯 Recommended Setup Priority

For production deployment, configure in this order:

1. **Email** (REQUIRED) - For user notifications
2. **Stripe** (If accepting payments) - Revenue collection
3. **Twilio** (RECOMMENDED) - Customer communication
4. **AWS S3** (RECOMMENDED) - Scalable file storage
5. **QuickBooks/Zoho** (If needed) - Accounting integration
6. **Google Calendar** (OPTIONAL) - Schedule management

---

## 💡 Need Help?

- Check integration service documentation
- Review FieldPro logs: `docker compose logs backend`
- Test with sandbox/development credentials first
- Contact integration provider support
- Open GitHub issue for FieldPro-specific problems

---

**Last Updated**: November 2025

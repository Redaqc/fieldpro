# FieldPro Migration Guide - Base44 to Self-Hosted

This guide walks through the complete migration process from Base44 BaaS to the self-hosted FieldPro platform.

## Overview

The migration transforms your Base44 application into a fully self-hosted multi-tenant SaaS platform with:
- PostgreSQL database with schema-per-tenant isolation
- NestJS backend with REST API
- React frontend with updated API clients
- Complete data migration from Base44 export

## Pre-Migration Checklist

- [ ] Export all data from Base44
- [ ] Document custom Base44 functions and workflows
- [ ] Note any custom UI modifications
- [ ] List all Base44 integrations
- [ ] Backup current application

## Migration Steps

### 1. Export Data from Base44

From your Base44 console, export all collections:
- Customers
- Jobs
- Technicians
- Invoices
- Quotations
- Materials
- Assets
- Any custom collections

Save the export as `base44-export.json`

### 2. Set Up New Environment

```bash
# Clone or set up the FieldPro repository
cd fieldpro

# Run the complete setup
./scripts/setup.sh
```

This will:
- Install all dependencies
- Set up Docker services (PostgreSQL, Redis)
- Run database migrations
- Generate Prisma client

### 3. Create Your Tenant

```bash
./scripts/create-tenant.sh your-company "Your Company Name"
```

This creates:
- Tenant record in the system
- Dedicated database schema
- All necessary tables

### 4. Migrate Your Data

```bash
cd backend
npm run migrate:base44 -- --tenant-slug=your-company --json-file=../base44-export.json
```

The migration script will:
- Import all customers
- Import all technicians
- Import all materials and assets
- Import all jobs and service calls
- Import all quotations and invoices
- Preserve relationships between entities

### 5. Update Frontend Code

The new API clients are already generated in `src/api/`. Update your components to use them:

**Before (Base44):**
```typescript
import { base44 } from './base44';

const customers = await base44.collection('customers').find();
```

**After (Self-Hosted):**
```typescript
import { customersApi } from './api';

const customers = await customersApi.getAll();
```

### 6. Configure Authentication

Create your first admin user:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "secure-password",
    "first_name": "Admin",
    "last_name": "User",
    "tenant_name": "Your Company",
    "tenant_slug": "your-company"
  }'
```

### 7. Test the Migration

1. **Start the servers:**
   ```bash
   ./scripts/dev.sh
   ```

2. **Verify data:**
   - Log in to the application
   - Check that all customers imported correctly
   - Verify jobs and their relationships
   - Test creating new records
   - Verify invoices and payments

3. **Test API endpoints:**
   - Visit http://localhost:3000/api/docs
   - Try various endpoints with the Swagger UI

## Feature Mapping

### Base44 → FieldPro

| Base44 Feature | FieldPro Equivalent | Notes |
|----------------|---------------------|-------|
| Collections | Database Tables | Schema-per-tenant |
| Base44 Auth | JWT Auth | New auth system |
| Base44 Functions | NestJS Services | Server-side logic |
| Base44 Queries | Prisma Queries | Type-safe ORM |
| Base44 Realtime | WebSocket (planned) | Coming soon |
| Base44 Storage | S3/Local Storage | Configure separately |
| Base44 Email | SMTP/SendGrid | Configure separately |

## API Changes

### Authentication

**Base44:**
```typescript
await base44.auth.signIn(email, password);
```

**FieldPro:**
```typescript
import { authApi } from './api';

const response = await authApi.login({
  email,
  password,
  tenant_slug: 'your-company'
});

localStorage.setItem('access_token', response.access_token);
localStorage.setItem('tenant_slug', 'your-company');
```

### CRUD Operations

**Base44:**
```typescript
// Create
await base44.collection('customers').insert({
  firstName: 'John',
  lastName: 'Doe'
});

// Read
const customers = await base44.collection('customers').find();

// Update
await base44.collection('customers').update(id, { firstName: 'Jane' });

// Delete
await base44.collection('customers').delete(id);
```

**FieldPro:**
```typescript
import { customersApi } from './api';

// Create
await customersApi.create({
  first_name: 'John',
  last_name: 'Doe'
});

// Read
const customers = await customersApi.getAll();

// Update
await customersApi.update(id, { first_name: 'Jane' });

// Delete
await customersApi.delete(id);
```

## Custom Logic Migration

### Base44 Functions → NestJS Services

If you have custom Base44 functions, migrate them to NestJS services:

**Base44 Function:**
```javascript
// base44-functions/calculateInvoiceTotal.js
module.exports = async (lineItems) => {
  return lineItems.reduce((sum, item) => sum + item.total, 0);
};
```

**FieldPro Service:**
```typescript
// backend/src/invoices/invoices.service.ts
calculateTotal(lineItems: LineItem[]): number {
  return lineItems.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price);
  }, 0);
}
```

### Base44 Triggers → NestJS Interceptors/Hooks

**Base44 Trigger:**
```javascript
// Trigger on customer creation
base44.collection('customers').onCreate(async (customer) => {
  await sendWelcomeEmail(customer.email);
});
```

**FieldPro Service:**
```typescript
@Injectable()
export class CustomersService {
  async create(data: CreateCustomerDto) {
    const customer = await this.tenantPrisma.create(...);

    // Send welcome email
    await this.emailService.sendWelcome(customer.email);

    return customer;
  }
}
```

## Post-Migration Tasks

### 1. Configure Email Service

Update `backend/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

### 2. Set Up File Storage

Configure S3 or local storage for documents and attachments.

### 3. Configure Webhooks

If you had Base44 webhooks, set up new webhook endpoints in NestJS.

### 4. Update Mobile Apps

If you have mobile apps using Base44 SDK, update them to use the new REST API.

### 5. Set Up Backups

```bash
# Add to crontab
0 2 * * * /home/user/fieldpro/scripts/backup-db.sh
```

### 6. Configure SSL/TLS

Use nginx or Caddy as a reverse proxy with Let's Encrypt SSL certificates.

### 7. Set Up Monitoring

- Application monitoring (PM2, New Relic)
- Database monitoring
- Error tracking (Sentry)
- Uptime monitoring

## Troubleshooting

### Migration Script Fails

**Issue:** Foreign key constraint errors during migration

**Solution:**
```bash
# Migrate in correct order:
# 1. Customers
# 2. Technicians
# 3. Materials
# 4. Assets
# 5. Jobs
# 6. Quotations
# 7. Invoices
```

### Authentication Issues

**Issue:** Can't log in after migration

**Solution:**
- Verify tenant_slug matches exactly
- Check JWT_SECRET in .env
- Ensure tokens are being stored correctly

### Data Not Showing Up

**Issue:** Data imported but not visible in app

**Solution:**
- Check tenant context: `SELECT current_schema();`
- Verify data in correct schema: `SELECT * FROM tenant_yourcompany.customers;`
- Check middleware is extracting tenant correctly

## Performance Optimization

### Database Indexes

The migration creates standard indexes. Add custom indexes as needed:

```sql
CREATE INDEX idx_jobs_scheduled_date ON tenant_yourcompany.jobs(scheduled_date);
CREATE INDEX idx_customers_email_gin ON tenant_yourcompany.customers USING gin(email gin_trgm_ops);
```

### Redis Caching

Configure Redis caching for frequently accessed data:

```typescript
@Injectable()
export class CustomersService {
  @Cacheable({ ttl: 300 })
  async findAll(tenantId: string) {
    return this.tenantPrisma.findMany(tenantId, 'Customer', {});
  }
}
```

## Rollback Plan

If you need to rollback to Base44:

1. Keep Base44 running during migration testing
2. Use feature flags to control which system is active
3. Maintain parallel writes during transition period
4. Have Base44 credentials and exports ready

## Support

For migration assistance:
- Check logs: `docker-compose logs -f`
- Database queries: `docker-compose exec postgres psql -U postgres -d fieldpro_saas`
- Create GitHub issues for bugs
- Join the community Discord

## Next Steps

After successful migration:
1. Train your team on the new system
2. Update documentation
3. Decommission Base44 account
4. Set up production hosting
5. Configure CDN for assets
6. Implement additional features as needed

---

**Estimated Migration Time:** 2-4 hours for a standard setup with < 10k records
**Downtime Required:** Can be done with zero downtime using parallel operations

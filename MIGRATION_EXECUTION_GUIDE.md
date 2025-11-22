# FieldPro Base44 to NestJS Migration - Execution Guide

## 🎯 Mission Status

### ✅ Phase 1-2: COMPLETE (Foundation Built)

**What's Done:**
- ✅ Prisma schema with 45 models
- ✅ NestJS backend scaffold with Docker
- ✅ JWT authentication (access + refresh tokens)
- ✅ 6 complete entity modules:
  - Users
  - Customers
  - Jobs
  - Technicians
  - **Invoices** (NEW - with payment recording)
  - **Payments** (NEW - with statistics)

**Backend Coverage:** 6 / 45 modules = **13% complete**

**API Endpoints Created:** 45+ endpoints

---

## 🚧 Phase 3: IN PROGRESS (Remaining Backend Modules)

### Priority 1 Modules (Next to Build)

Based on usage frequency from the Base44 audit:

| Module | Usage Count | Status | Priority |
|--------|------------|--------|----------|
| ServiceCalls | 9 calls | ⏳ TODO | HIGH |
| Materials | 7 calls | ⏳ TODO | HIGH |
| TimeEntries | 6 calls | ⏳ TODO | HIGH |
| Assets | 5 calls | ⏳ TODO | MEDIUM |
| Quotations | 3 calls | ⏳ TODO | MEDIUM |
| WorkTypes | 5 calls | ⏳ TODO | MEDIUM |
| RecurringJobs | 2 calls | ⏳ TODO | MEDIUM |

### Full Module List (38 Remaining)

**Core Business** (7 modules):
- [ ] ServiceCallsModule
- [ ] QuotationsModule
- [ ] RecurringJobsModule
- [ ] SupplierInvoicesModule
- [ ] WorkTypesModule
- [ ] ProfitabilityRecordsModule
- [ ] CustomerFeedbackModule

**Inventory & Assets** (5 modules):
- [ ] MaterialsModule
- [ ] AssetsModule
- [ ] PriceListsModule
- [ ] BundlesModule
- [ ] MaintenanceSchedulesModule

**Time & Tracking** (4 modules):
- [ ] TimeEntriesModule
- [ ] GPSTrackingModule
- [ ] GPSZonesModule
- [ ] GPSAlertsModule

**Forms & Automation** (4 modules):
- [ ] FormTemplatesModule
- [ ] FormSubmissionsModule
- [ ] FormAutomationsModule
- [ ] AutomationsModule

**Notifications** (5 modules):
- [ ] NotificationsModule
- [ ] NotificationPreferencesModule
- [ ] NotificationTemplatesModule
- [ ] PushSubscriptionsModule
- [ ] AlertsModule

**Integrations** (4 modules):
- [ ] IntegrationsModule
- [ ] IntegrationSettingsModule
- [ ] SyncLogsModule
- [ ] WebhooksModule

**Configuration** (9 modules):
- [ ] AppSettingsModule
- [ ] TaxSettingsModule
- [ ] BrandingSettingsModule
- [ ] LanguageSettingsModule
- [ ] CompanyInfoModule
- [ ] DashboardConfigModule
- [ ] CustomFieldsModule
- [ ] ChecklistTemplatesModule
- [ ] RolesModule (extended)
- [ ] DocumentsModule
- [ ] TeamMessagesModule

---

## 📝 MODULE CREATION TEMPLATE

### Step 1: Create DTOs

```typescript
// backend/src/service-calls/dto/create-service-call.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ServiceCallStatus } from '@prisma/client';

export class CreateServiceCallDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty({ enum: ServiceCallStatus, default: ServiceCallStatus.OPEN })
  @IsOptional()
  @IsEnum(ServiceCallStatus)
  status?: ServiceCallStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  technicianId?: string;
}

// backend/src/service-calls/dto/update-service-call.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateServiceCallDto } from './create-service-call.dto';

export class UpdateServiceCallDto extends PartialType(CreateServiceCallDto) {}
```

### Step 2: Create Service

```typescript
// backend/src/service-calls/service-calls.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceCallDto } from './dto/create-service-call.dto';
import { UpdateServiceCallDto } from './dto/update-service-call.dto';

@Injectable()
export class ServiceCallsService {
  constructor(private prisma: PrismaService) {}

  async create(createServiceCallDto: CreateServiceCallDto) {
    const serviceCall = await this.prisma.serviceCall.create({
      data: {
        ...createServiceCallDto,
        scheduledDate: createServiceCallDto.scheduledDate
          ? new Date(createServiceCallDto.scheduledDate)
          : null,
      },
      include: {
        customer: true,
        technician: true,
      },
    });
    return serviceCall;
  }

  async findAll(page = 1, limit = 20, status?: string, customerId?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const [serviceCalls, total] = await Promise.all([
      this.prisma.serviceCall.findMany({
        where,
        skip,
        take: limit,
        include: { customer: true, technician: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.serviceCall.count({ where }),
    ]);

    return {
      data: serviceCalls,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const serviceCall = await this.prisma.serviceCall.findUnique({
      where: { id },
      include: { customer: true, technician: true },
    });

    if (!serviceCall) {
      throw new NotFoundException(`ServiceCall with ID ${id} not found`);
    }

    return serviceCall;
  }

  async update(id: string, updateServiceCallDto: UpdateServiceCallDto) {
    await this.findOne(id);

    const serviceCall = await this.prisma.serviceCall.update({
      where: { id },
      data: {
        ...updateServiceCallDto,
        scheduledDate: updateServiceCallDto.scheduledDate
          ? new Date(updateServiceCallDto.scheduledDate)
          : undefined,
      },
      include: { customer: true, technician: true },
    });

    return serviceCall;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.serviceCall.delete({ where: { id } });
    return { message: 'ServiceCall deleted successfully' };
  }
}
```

### Step 3: Create Controller

```typescript
// backend/src/service-calls/service-calls.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ServiceCallsService } from './service-calls.service';
import { CreateServiceCallDto } from './dto/create-service-call.dto';
import { UpdateServiceCallDto } from './dto/update-service-call.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Service Calls')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('service-calls')
export class ServiceCallsController {
  constructor(private readonly serviceCallsService: ServiceCallsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  create(@Body() createServiceCallDto: CreateServiceCallDto) {
    return this.serviceCallsService.create(createServiceCallDto);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.serviceCallsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
      customerId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceCallsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() updateServiceCallDto: UpdateServiceCallDto) {
    return this.serviceCallsService.update(id, updateServiceCallDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.serviceCallsService.remove(id);
  }
}
```

### Step 4: Create Module

```typescript
// backend/src/service-calls/service-calls.module.ts
import { Module } from '@nestjs/common';
import { ServiceCallsService } from './service-calls.service';
import { ServiceCallsController } from './service-calls.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceCallsController],
  providers: [ServiceCallsService],
  exports: [ServiceCallsService],
})
export class ServiceCallsModule {}
```

### Step 5: Register in AppModule

```typescript
// backend/src/app.module.ts
import { ServiceCallsModule } from './service-calls/service-calls.module';

@Module({
  imports: [
    // ... existing modules
    ServiceCallsModule, // ADD THIS
  ],
})
export class AppModule {}
```

---

## 🔌 FRONTEND API CLIENT (Replaces Base44 SDK)

Create this file to replace all `base44.*` calls:

```typescript
// src/api/apiClient.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retried, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
              headers: { Authorization: `Bearer ${refreshToken}` },
            });

            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);

            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic CRUD methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data.data || response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data.data || response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch(url, data, config);
    return response.data.data || response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data.data || response.data;
  }

  // Entity-specific helpers (replaces base44.entities.*)
  entities = {
    Job: {
      list: (params?: any) => this.get('/jobs', { params }),
      create: (data: any) => this.post('/jobs', data),
      update: (id: string, data: any) => this.patch(`/jobs/${id}`, data),
      delete: (id: string) => this.delete(`/jobs/${id}`),
      findOne: (id: string) => this.get(`/jobs/${id}`),
    },
    Customer: {
      list: (params?: any) => this.get('/customers', { params }),
      create: (data: any) => this.post('/customers', data),
      update: (id: string, data: any) => this.patch(`/customers/${id}`, data),
      delete: (id: string) => this.delete(`/customers/${id}`),
      findOne: (id: string) => this.get(`/customers/${id}`),
    },
    Technician: {
      list: (params?: any) => this.get('/technicians', { params }),
      create: (data: any) => this.post('/technicians', data),
      update: (id: string, data: any) => this.patch(`/technicians/${id}`, data),
      delete: (id: string) => this.delete(`/technicians/${id}`),
      findOne: (id: string) => this.get(`/technicians/${id}`),
    },
    Invoice: {
      list: (params?: any) => this.get('/invoices', { params }),
      create: (data: any) => this.post('/invoices', data),
      update: (id: string, data: any) => this.patch(`/invoices/${id}`, data),
      delete: (id: string) => this.delete(`/invoices/${id}`),
      findOne: (id: string) => this.get(`/invoices/${id}`),
      statistics: (customerId?: string) =>
        this.get('/invoices/statistics', { params: { customerId } }),
    },
    Payment: {
      list: (params?: any) => this.get('/payments', { params }),
      create: (data: any) => this.post('/payments', data),
      update: (id: string, data: any) => this.patch(`/payments/${id}`, data),
      delete: (id: string) => this.delete(`/payments/${id}`),
      findOne: (id: string) => this.get(`/payments/${id}`),
    },
    // ADD MORE ENTITIES AS MODULES ARE CREATED
  };

  // Auth methods (replaces base44.auth.*)
  auth = {
    login: (email: string, password: string) =>
      this.post('/auth/login', { email, password }),
    register: (data: any) => this.post('/auth/register', data),
    logout: (refreshToken: string) => this.post('/auth/logout', { refreshToken }),
    me: () => this.get('/auth/me'),
    refresh: () => this.post('/auth/refresh'),
  };
}

export const apiClient = new APIClient();
export default apiClient;
```

---

## 🔄 FRONTEND MIGRATION STEPS

### Step 1: Update Imports

**OLD:**
```javascript
import { base44 } from '@/api/base44Client';
```

**NEW:**
```javascript
import { apiClient } from '@/api/apiClient';
```

### Step 2: Replace Entity Calls

**OLD:**
```javascript
// List
const { data: jobs } = useQuery({
  queryKey: ['jobs'],
  queryFn: () => base44.entities.Job.list('-created_date'),
});

// Create
const createMutation = useMutation({
  mutationFn: (data) => base44.entities.Job.create(data),
});

// Update
base44.entities.Job.update(jobId, { status: 'completed' });

// Delete
base44.entities.Job.delete(jobId);

// Filter
const jobs = await base44.entities.Job.filter({ customer_id: customerId });
```

**NEW:**
```javascript
// List (sorting handled by backend)
const { data: jobs } = useQuery({
  queryKey: ['jobs'],
  queryFn: () => apiClient.entities.Job.list(),
});

// Create
const createMutation = useMutation({
  mutationFn: (data) => apiClient.entities.Job.create(data),
});

// Update
apiClient.entities.Job.update(jobId, { status: 'completed' });

// Delete
apiClient.entities.Job.delete(jobId);

// Filter (use query params)
const jobs = await apiClient.entities.Job.list({ customerId });
```

### Step 3: Replace Auth Calls

**OLD:**
```javascript
const user = await base44.auth.me();
base44.auth.logout();
base44.auth.redirectToLogin(returnUrl);
```

**NEW:**
```javascript
const user = await apiClient.auth.me();
await apiClient.auth.logout(refreshToken);
window.location.href = `/login?redirect=${encodeURIComponent(returnUrl)}`;
```

### Step 4: Replace Function Calls

**OLD:**
```javascript
const result = await base44.functions.invoke('csvExport', {
  entity_type: 'customers'
});
```

**NEW (when service created):**
```javascript
const result = await apiClient.post('/export/csv', {
  entity_type: 'customers'
});
```

---

## 📋 MIGRATION CHECKLIST

### Backend (Modules)

**Completed (6/45):**
- [x] UsersModule
- [x] CustomersModule
- [x] JobsModule
- [x] TechniciansModule
- [x] InvoicesModule
- [x] PaymentsModule

**Priority 1 (7 modules):**
- [ ] ServiceCallsModule
- [ ] MaterialsModule
- [ ] TimeEntriesModule
- [ ] AssetsModule
- [ ] QuotationsModule
- [ ] WorkTypesModule
- [ ] RecurringJobsModule

**Priority 2 (17 modules):**
- [ ] SupplierInvoicesModule
- [ ] PriceListsModule
- [ ] BundlesModule
- [ ] MaintenanceSchedulesModule
- [ ] GPSTrackingModule
- [ ] GPSZonesModule
- [ ] GPSAlertsModule
- [ ] FormTemplatesModule
- [ ] FormSubmissionsModule
- [ ] FormAutomationsModule
- [ ] AutomationsModule
- [ ] NotificationsModule
- [ ] NotificationPreferencesModule
- [ ] NotificationTemplatesModule
- [ ] PushSubscriptionsModule
- [ ] AlertsModule
- [ ] ProfitabilityRecordsModule

**Priority 3 (15 modules):**
- [ ] IntegrationsModule
- [ ] IntegrationSettingsModule
- [ ] SyncLogsModule
- [ ] WebhooksModule
- [ ] AppSettingsModule
- [ ] TaxSettingsModule
- [ ] BrandingSettingsModule
- [ ] LanguageSettingsModule
- [ ] CompanyInfoModule
- [ ] DashboardConfigModule
- [ ] CustomFieldsModule
- [ ] ChecklistTemplatesModule
- [ ] RolesModule
- [ ] DocumentsModule
- [ ] TeamMessagesModule
- [ ] CustomerFeedbackModule

### Frontend (Files to Update)

**Core Files:**
- [ ] src/api/apiClient.ts (CREATE NEW)
- [ ] src/lib/AuthContext.jsx (UPDATE)
- [ ] src/lib/app-params.js (UPDATE/REMOVE)

**Pages (41 files):**
- [ ] src/pages/Dashboard.jsx
- [ ] src/pages/Jobs.jsx
- [ ] src/pages/Schedule.jsx
- [ ] src/pages/Team.jsx
- [ ] src/pages/Invoices.jsx
- [ ] src/pages/Customers.jsx
- [ ] [... 35 more pages]

**Components (211 files):**
- [ ] src/components/jobs/*.jsx
- [ ] src/components/invoices/*.jsx
- [ ] src/components/schedule/*.jsx
- [ ] src/components/dashboard/*.jsx
- [ ] [... many more components]

---

## 🧪 TESTING STRATEGY

### 1. Unit Tests
```bash
cd backend
npm run test
```

### 2. Integration Tests
```bash
npm run test:e2e
```

### 3. Manual Testing Flow
1. Start backend: `cd backend && npm run start:dev`
2. Test authentication: Register → Login → Get /auth/me
3. Test CRUD: Create job → List jobs → Update job → Delete job
4. Test relationships: Create invoice → Link to job → Record payment
5. Test filters: List jobs by customer → List by status

### 4. Migration Validation
- [ ] All Base44 imports removed
- [ ] All API calls use new apiClient
- [ ] Authentication works end-to-end
- [ ] Data persists to PostgreSQL
- [ ] All critical user flows functional

---

## 🚀 DEPLOYMENT STEPS

### 1. Database Migration
```bash
cd backend
npx prisma migrate deploy
```

### 2. Start Services
```bash
docker-compose up -d
```

### 3. Verify Health
```bash
curl http://localhost:3001/api/v1/health
curl http://localhost:3001/api/docs
```

---

## 📊 PROGRESS TRACKING

| Phase | Tasks | Status | Progress |
|-------|-------|--------|----------|
| Phase 1 | Prisma Schema | ✅ Complete | 100% |
| Phase 2 | Backend Scaffold | ✅ Complete | 100% |
| Phase 3.1 | Priority 1 Modules (7) | 🟡 In Progress | 0/7 |
| Phase 3.2 | Priority 2 Modules (17) | ⏸️ Pending | 0/17 |
| Phase 3.3 | Priority 3 Modules (15) | ⏸️ Pending | 0/15 |
| Phase 4 | Frontend Migration | ⏸️ Pending | 0/123 files |
| Phase 5 | Testing | ⏸️ Pending | 0% |
| Phase 6 | Deployment | ⏸️ Pending | 0% |

**Overall Progress:** 13% (6/45 backend modules complete)

---

## 🎯 NEXT IMMEDIATE ACTIONS

1. **Create ServiceCalls Module** (highest priority, 9 calls in frontend)
2. **Create Materials Module** (7 calls)
3. **Create TimeEntries Module** (6 calls)
4. **Test the 3 new modules** with Postman/curl
5. **Create frontend apiClient.ts**
6. **Update 1 page** (e.g., Jobs.jsx) as proof of concept
7. **Expand to all pages** once pattern validated

---

**Document Version:** 1.0
**Last Updated:** 2025-11-22
**Status:** Phase 3 (Backend Modules) - 13% Complete

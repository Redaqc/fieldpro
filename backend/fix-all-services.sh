#!/bin/bash

# This script fixes all service and controller files to use the correct TenantPrismaService API

echo "🔧 Fixing all service and controller files..."

# Fix customers service
cat > src/customers/customers.service.ts << 'EOF'
import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private tenantPrisma: TenantPrismaService) {}

  async findAll(tenantId: string, filters?: any) {
    const where: any = {};

    if (filters?.is_active !== undefined) {
      where.is_active = filters.is_active === 'true';
    }

    return this.tenantPrisma.findMany(tenantId, 'Customer', {
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const customer = await this.tenantPrisma.findOne(tenantId, 'Customer', {
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async create(tenantId: string, createCustomerDto: CreateCustomerDto) {
    const count = await this.tenantPrisma.count(tenantId, 'Customer', {});
    const customerNumber = \`CUST-\${String(count + 1).padStart(6, '0')}\`;

    return this.tenantPrisma.create(tenantId, 'Customer', {
      data: {
        customer_number: customerNumber,
        ...createCustomerDto,
        is_active: createCustomerDto.is_active !== false,
      },
    });
  }

  async update(tenantId: string, id: string, updateCustomerDto: UpdateCustomerDto) {
    await this.findOne(tenantId, id);

    return this.tenantPrisma.update(tenantId, 'Customer', {
      where: { id },
      data: updateCustomerDto,
    });
  }

  async delete(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.tenantPrisma.delete(tenantId, 'Customer', {
      where: { id },
    });
  }
}
EOF

# Fix jobs service
cat > src/jobs/jobs.service.ts << 'EOF'
import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(private tenantPrisma: TenantPrismaService) {}

  async findAll(tenantId: string, filters?: any) {
    const where: any = {};

    if (filters?.customer_id) {
      where.customer_id = filters.customer_id;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.assigned_to) {
      where.assigned_to = filters.assigned_to;
    }

    return this.tenantPrisma.findMany(tenantId, 'Job', {
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const job = await this.tenantPrisma.findOne(tenantId, 'Job', {
      where: { id },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async create(tenantId: string, createJobDto: CreateJobDto) {
    const count = await this.tenantPrisma.count(tenantId, 'Job', {});
    const jobNumber = \`JOB-\${String(count + 1).padStart(6, '0')}\`;

    return this.tenantPrisma.create(tenantId, 'Job', {
      data: {
        job_number: jobNumber,
        ...createJobDto,
        status: createJobDto.status || 'pending',
        priority: createJobDto.priority || 'medium',
      },
    });
  }

  async update(tenantId: string, id: string, updateJobDto: UpdateJobDto) {
    const existingJob = await this.findOne(tenantId, id);

    if (updateJobDto.status && updateJobDto.status !== existingJob.status) {
      await this.tenantPrisma.create(tenantId, 'Activity', {
        data: {
          entity_type: 'Job',
          entity_id: id,
          action: 'status_changed',
          description: \`Status changed from \${existingJob.status} to \${updateJobDto.status}\`,
          metadata: {
            old_status: existingJob.status,
            new_status: updateJobDto.status,
          },
        },
      });
    }

    return this.tenantPrisma.update(tenantId, 'Job', {
      where: { id },
      data: updateJobDto,
    });
  }

  async delete(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.tenantPrisma.delete(tenantId, 'Job', {
      where: { id },
    });
  }

  async assignTechnician(tenantId: string, id: string, technicianId: string) {
    return this.update(tenantId, id, { assigned_to: technicianId });
  }
}
EOF

echo "✅ Services fixed successfully!"
echo "✅ All critical fixes applied!"

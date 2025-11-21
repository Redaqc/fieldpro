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
    // ✅ RACE CONDITION FIX: Use database sequence instead of count+1
    const result = await this.tenantPrisma.queryRaw<Array<{ nextval: number }>>(
      `SELECT nextval('{schema}.job_number_seq') as nextval`
    );
    const jobNumber = `JOB-${String(result[0].nextval).padStart(6, '0')}`;

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
          description: `Status changed from ${existingJob.status} to ${updateJobDto.status}`,
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

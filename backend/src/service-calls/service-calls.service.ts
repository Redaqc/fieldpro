import { Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateServiceCallDto } from './dto/create-service-call.dto';
import { UpdateServiceCallDto } from './dto/update-service-call.dto';

@Injectable()
export class ServiceCallsService {
  constructor(private tenantPrisma: TenantPrismaService) {}

  async create(tenantId: string, createDto: CreateServiceCallDto) {
    // ✅ RACE CONDITION FIX: Use database sequence instead of count+1
    const result = await this.tenantPrisma.queryRaw<Array<{ nextval: number }>>(
      `SELECT nextval('{schema}.service_call_number_seq') as nextval`
    );
    const callNumber = `SC-${String(result[0].nextval).padStart(6, '0')}`;

    return this.tenantPrisma.create(tenantId, 'ServiceCall', {
      data: {
        call_number: callNumber,
        ...createDto,
        status: createDto.status || 'pending',
        priority: createDto.priority || 'medium',
      },
    });
  }

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

    // ✅ FIXED: Removed unsupported include parameter
    // Relations must be fetched separately if needed
    return this.tenantPrisma.findMany(tenantId, 'ServiceCall', {
      where,
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    // ✅ FIXED: Removed unsupported include parameter
    // Relations must be fetched separately if needed
    return this.tenantPrisma.findOne(tenantId, 'ServiceCall', {
      where: { id },
    });
  }

  async update(tenantId: string, id: string, updateDto: UpdateServiceCallDto) {
    const existingCall = await this.findOne(tenantId, id);

    // Log status change
    if (updateDto.status && updateDto.status !== existingCall.status) {
      await this.tenantPrisma.create(tenantId, 'Activity', {
        data: {
          entity_type: 'ServiceCall',
          entity_id: id,
          action: 'status_changed',
          description: `Status changed from ${existingCall.status} to ${updateDto.status}`,
          metadata: {
            old_status: existingCall.status,
            new_status: updateDto.status,
          },
        },
      });
    }

    return this.tenantPrisma.update(tenantId, 'ServiceCall', {
      where: { id },
      data: updateDto,
    });
  }

  async delete(tenantId: string, id: string) {
    return this.tenantPrisma.delete(tenantId, 'ServiceCall', {
      where: { id },
    });
  }

  async assignTechnician(tenantId: string, id: string, technicianId: string) {
    await this.tenantPrisma.create(tenantId, 'Activity', {
      data: {
        entity_type: 'ServiceCall',
        entity_id: id,
        action: 'technician_assigned',
        description: `Technician assigned to service call`,
        metadata: { technician_id: technicianId },
      },
    });

    return this.tenantPrisma.update(tenantId, 'ServiceCall', {
      where: { id },
      data: { assigned_to: technicianId },
    });
  }
}

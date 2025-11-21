import { Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Injectable()
export class AssetsService {
  constructor(private tenantPrisma: TenantPrismaService) {}

  async create(tenantId: string, createDto: CreateAssetDto) {
    return this.tenantPrisma.create(tenantId, 'Asset', {
      data: {
        ...createDto,
        status: createDto.status || 'active',
        purchase_date: createDto.purchase_date
          ? new Date(createDto.purchase_date)
          : undefined,
        warranty_expires: createDto.warranty_expires
          ? new Date(createDto.warranty_expires)
          : undefined,
      },
    });
  }

  async findAll(tenantId: string, filters?: any) {
    const where: any = {};

    if (filters?.customer_id) {
      where.customer_id = filters.customer_id;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { asset_tag: { contains: filters.search, mode: 'insensitive' } },
        { serial_number: { contains: filters.search, mode: 'insensitive' } },
        { model: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.tenantPrisma.findMany(tenantId, 'Asset', {
      where,
      include: {
        customer: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.tenantPrisma.findOne(tenantId, 'Asset', {
      where: { id },
      include: {
        customer: true,
        jobs: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
        service_calls: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
    });
  }

  async update(tenantId: string, id: string, updateDto: UpdateAssetDto) {
    const updateData: any = { ...updateDto };

    if (updateDto.purchase_date) {
      updateData.purchase_date = new Date(updateDto.purchase_date);
    }

    if (updateDto.warranty_expires) {
      updateData.warranty_expires = new Date(updateDto.warranty_expires);
    }

    return this.tenantPrisma.update(tenantId, 'Asset', {
      where: { id },
      data: updateData,
    });
  }

  async delete(tenantId: string, id: string) {
    return this.tenantPrisma.delete(tenantId, 'Asset', {
      where: { id },
    });
  }

  async getMaintenanceHistory(tenantId: string, id: string) {
    const jobs = await this.tenantPrisma.findMany(tenantId, 'Job', {
      where: {
        asset_id: id,
      },
      include: {
        customer: true,
        assigned_technician: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return jobs;
  }
}

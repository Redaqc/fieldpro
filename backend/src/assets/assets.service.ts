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
    // ✅ FIXED: Handle search with queryRaw since TenantPrismaService doesn't support OR/contains/include
    if (filters?.search) {
      const params: any[] = [];
      let paramIndex = 1;
      const searchPattern = `%${filters.search}%`;

      let query = `SELECT * FROM {schema}.assets WHERE `;
      const conditions: string[] = [
        `name ILIKE $${paramIndex}`,
        `asset_tag ILIKE $${paramIndex}`,
        `serial_number ILIKE $${paramIndex}`,
        `model ILIKE $${paramIndex}`,
      ];
      params.push(searchPattern);
      paramIndex++;

      query += `(${conditions.join(' OR ')})`;

      // Add customer_id filter if provided
      if (filters.customer_id) {
        query += ` AND customer_id = $${paramIndex}`;
        params.push(filters.customer_id);
        paramIndex++;
      }

      // Add category filter if provided
      if (filters.category) {
        query += ` AND category = $${paramIndex}`;
        params.push(filters.category);
        paramIndex++;
      }

      // Add status filter if provided
      if (filters.status) {
        query += ` AND status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC`;

      return this.tenantPrisma.queryRaw<any[]>(query, params);
    }

    // No search - use simple where clause
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

    // ✅ FIXED: Removed unsupported include parameter
    return this.tenantPrisma.findMany(tenantId, 'Asset', {
      where,
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    // ✅ FIXED: Removed unsupported include parameter
    // Relations must be fetched separately if needed
    return this.tenantPrisma.findOne(tenantId, 'Asset', {
      where: { id },
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
    // ✅ FIXED: Removed unsupported include parameter
    const jobs = await this.tenantPrisma.findMany(tenantId, 'Job', {
      where: {
        asset_id: id,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return jobs;
  }
}

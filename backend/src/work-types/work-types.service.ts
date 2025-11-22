import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateWorkTypeDto } from './dto/create-work-type.dto';
import { UpdateWorkTypeDto } from './dto/update-work-type.dto';

@Injectable()
export class WorkTypesService {
  private readonly logger = new Logger(WorkTypesService.name);

  constructor(private tenantPrisma: TenantPrismaService) {}

  async create(tenantId: string, createDto: CreateWorkTypeDto) {
    return this.tenantPrisma.create(tenantId, 'WorkType', {
      data: {
        name: createDto.name,
        description: createDto.description,
        category: createDto.category,
        default_hourly_rate: createDto.default_hourly_rate,
        default_duration_minutes: createDto.default_duration_minutes,
        color: createDto.color || '#3B82F6',
        is_active: createDto.is_active ?? true,
        require_signature: createDto.require_signature ?? false,
        require_photo: createDto.require_photo ?? false,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async findAll(tenantId: string, filters?: any) {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.is_active !== undefined) {
      where.is_active = filters.is_active === 'true';
    }

    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      const params: any[] = [searchPattern];
      let paramIndex = 2;

      let query = `SELECT * FROM {schema}.work_types WHERE (name ILIKE $1 OR description ILIKE $1)`;

      if (filters?.category) {
        query += ` AND category = $${paramIndex}`;
        params.push(filters.category);
        paramIndex++;
      }

      if (filters?.is_active !== undefined) {
        query += ` AND is_active = $${paramIndex}`;
        params.push(filters.is_active === 'true');
      }

      query += ` ORDER BY created_at DESC`;

      return this.tenantPrisma.queryRaw<any[]>(query, params);
    }

    return this.tenantPrisma.findMany(tenantId, 'WorkType', {
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const workType = await this.tenantPrisma.findOne(tenantId, 'WorkType', {
      where: { id },
    });

    if (!workType) {
      throw new NotFoundException('Work type not found');
    }

    return workType;
  }

  async update(tenantId: string, id: string, updateDto: UpdateWorkTypeDto) {
    await this.findOne(tenantId, id);

    return this.tenantPrisma.update(tenantId, 'WorkType', {
      where: { id },
      data: { ...updateDto, updated_at: new Date() },
    });
  }

  async delete(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.tenantPrisma.delete(tenantId, 'WorkType', {
      where: { id },
    });
  }

  async getCategories(tenantId: string) {
    const result = await this.tenantPrisma.queryRaw<any[]>(
      `SELECT DISTINCT category FROM {schema}.work_types WHERE is_active = true AND category IS NOT NULL ORDER BY category`
    );

    return result.map((row) => row.category);
  }
}

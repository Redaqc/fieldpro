import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';

@Injectable()
export class BundlesService {
  private readonly logger = new Logger(BundlesService.name);

  constructor(private tenantPrisma: TenantPrismaService) {}

  async create(tenantId: string, createDto: CreateBundleDto) {
    return this.tenantPrisma.create(tenantId, 'Bundle', {
      data: {
        name: createDto.name,
        description: createDto.description,
        items: createDto.items,
        price: createDto.price,
        category: createDto.category,
        is_active: createDto.is_active ?? true,
        discount_percent: createDto.discount_percent || 0,
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

      let query = `SELECT * FROM {schema}.bundles WHERE (name ILIKE $1 OR description ILIKE $1)`;

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

    return this.tenantPrisma.findMany(tenantId, 'Bundle', {
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const bundle = await this.tenantPrisma.findOne(tenantId, 'Bundle', {
      where: { id },
    });

    if (!bundle) {
      throw new NotFoundException('Bundle not found');
    }

    return bundle;
  }

  async update(tenantId: string, id: string, updateDto: UpdateBundleDto) {
    await this.findOne(tenantId, id);

    return this.tenantPrisma.update(tenantId, 'Bundle', {
      where: { id },
      data: { ...updateDto, updated_at: new Date() },
    });
  }

  async delete(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.tenantPrisma.delete(tenantId, 'Bundle', {
      where: { id },
    });
  }

  async getCategories(tenantId: string) {
    const result = await this.tenantPrisma.queryRaw<any[]>(
      `SELECT DISTINCT category FROM {schema}.bundles WHERE is_active = true AND category IS NOT NULL ORDER BY category`
    );

    return result.map((row) => row.category);
  }
}

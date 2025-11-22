import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { UpdatePriceListDto } from './dto/update-price-list.dto';

@Injectable()
export class PriceListsService {
  private readonly logger = new Logger(PriceListsService.name);

  constructor(private tenantPrisma: TenantPrismaService) {}

  async create(tenantId: string, createDto: CreatePriceListDto) {
    // If setting as default, unset other defaults
    if (createDto.is_default) {
      await this.tenantPrisma.queryRaw(
        `UPDATE {schema}.price_lists SET is_default = false WHERE is_default = true`
      );
    }

    return this.tenantPrisma.create(tenantId, 'PriceList', {
      data: {
        name: createDto.name,
        description: createDto.description,
        items: createDto.items,
        effective_from: createDto.effective_from ? new Date(createDto.effective_from) : null,
        effective_until: createDto.effective_until ? new Date(createDto.effective_until) : null,
        is_active: createDto.is_active ?? true,
        is_default: createDto.is_default ?? false,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async findAll(tenantId: string, filters?: any) {
    const where: any = {};

    if (filters?.is_active !== undefined) {
      where.is_active = filters.is_active === 'true';
    }

    if (filters?.is_default !== undefined) {
      where.is_default = filters.is_default === 'true';
    }

    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      const params: any[] = [searchPattern];
      let paramIndex = 2;

      let query = `SELECT * FROM {schema}.price_lists WHERE (name ILIKE $1 OR description ILIKE $1)`;

      if (filters?.is_active !== undefined) {
        query += ` AND is_active = $${paramIndex}`;
        params.push(filters.is_active === 'true');
        paramIndex++;
      }

      if (filters?.is_default !== undefined) {
        query += ` AND is_default = $${paramIndex}`;
        params.push(filters.is_default === 'true');
      }

      query += ` ORDER BY created_at DESC`;

      return this.tenantPrisma.queryRaw<any[]>(query, params);
    }

    return this.tenantPrisma.findMany(tenantId, 'PriceList', {
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const priceList = await this.tenantPrisma.findOne(tenantId, 'PriceList', {
      where: { id },
    });

    if (!priceList) {
      throw new NotFoundException('Price list not found');
    }

    return priceList;
  }

  async update(tenantId: string, id: string, updateDto: UpdatePriceListDto) {
    await this.findOne(tenantId, id);

    // If setting as default, unset other defaults
    if (updateDto.is_default) {
      await this.tenantPrisma.queryRaw(
        `UPDATE {schema}.price_lists SET is_default = false WHERE is_default = true AND id != $1`,
        [id]
      );
    }

    const updateData: any = { ...updateDto };
    if (updateDto.effective_from) {
      updateData.effective_from = new Date(updateDto.effective_from);
    }
    if (updateDto.effective_until) {
      updateData.effective_until = new Date(updateDto.effective_until);
    }
    updateData.updated_at = new Date();

    return this.tenantPrisma.update(tenantId, 'PriceList', {
      where: { id },
      data: updateData,
    });
  }

  async delete(tenantId: string, id: string) {
    const priceList = await this.findOne(tenantId, id);

    if (priceList.is_default) {
      throw new BadRequestException('Cannot delete the default price list');
    }

    return this.tenantPrisma.delete(tenantId, 'PriceList', {
      where: { id },
    });
  }

  async getDefault(tenantId: string) {
    const result = await this.tenantPrisma.queryRaw<any[]>(
      `SELECT * FROM {schema}.price_lists WHERE is_default = true AND is_active = true LIMIT 1`
    );

    if (result.length === 0) {
      throw new NotFoundException('No default price list found');
    }

    return result[0];
  }

  async setDefault(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    // Unset all defaults
    await this.tenantPrisma.queryRaw(
      `UPDATE {schema}.price_lists SET is_default = false WHERE is_default = true`
    );

    // Set this one as default
    return this.update(tenantId, id, { is_default: true });
  }
}

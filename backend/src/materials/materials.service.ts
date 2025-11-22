import { Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialsService {
  constructor(private tenantPrisma: TenantPrismaService) {}

  async create(tenantId: string, createDto: CreateMaterialDto) {
    return this.tenantPrisma.create(tenantId, 'Material', {
      data: {
        ...createDto,
        is_active: createDto.is_active !== undefined ? createDto.is_active : true,
        quantity_in_stock: createDto.quantity_in_stock || 0,
      },
    });
  }

  async findAll(tenantId: string, filters?: any) {
    // ✅ FIXED: Handle search with queryRaw since TenantPrismaService doesn't support OR/contains
    if (filters?.search) {
      const params: any[] = [];
      let paramIndex = 1;
      const searchPattern = `%${filters.search}%`;

      let query = `SELECT * FROM {schema}.materials WHERE `;
      const conditions: string[] = [
        `name ILIKE $${paramIndex}`,
        `sku ILIKE $${paramIndex}`,
        `description ILIKE $${paramIndex}`,
      ];
      params.push(searchPattern);
      paramIndex++;

      query += `(${conditions.join(' OR ')})`;

      // Add category filter if provided
      if (filters.category) {
        query += ` AND category = $${paramIndex}`;
        params.push(filters.category);
        paramIndex++;
      }

      // Add is_active filter if provided
      if (filters.is_active !== undefined) {
        query += ` AND is_active = $${paramIndex}`;
        params.push(filters.is_active === 'true');
        paramIndex++;
      }

      query += ` ORDER BY name ASC`;

      return this.tenantPrisma.queryRaw<any[]>(query, params);
    }

    // No search - use simple where clause
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.is_active !== undefined) {
      where.is_active = filters.is_active === 'true';
    }

    return this.tenantPrisma.findMany(tenantId, 'Material', {
      where,
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.tenantPrisma.findOne(tenantId, 'Material', {
      where: { id },
    });
  }

  async update(tenantId: string, id: string, updateDto: UpdateMaterialDto) {
    return this.tenantPrisma.update(tenantId, 'Material', {
      where: { id },
      data: updateDto,
    });
  }

  async delete(tenantId: string, id: string) {
    return this.tenantPrisma.delete(tenantId, 'Material', {
      where: { id },
    });
  }

  async adjustStock(
    tenantId: string,
    id: string,
    adjustment: number,
    reason?: string,
  ) {
    const material = await this.findOne(tenantId, id);

    const newQuantity = material.quantity_in_stock + adjustment;

    // Log stock adjustment
    await this.tenantPrisma.create(tenantId, 'StockAdjustment', {
      data: {
        material_id: id,
        adjustment,
        previous_quantity: material.quantity_in_stock,
        new_quantity: newQuantity,
        reason,
      },
    });

    return this.update(tenantId, id, {
      quantity_in_stock: newQuantity,
    });
  }

  async getLowStockItems(tenantId: string) {
    // ✅ FIXED: Use queryRaw for column-to-column comparison
    // TenantPrismaService doesn't support complex operators like lte, AND, OR, or column comparisons
    return this.tenantPrisma.queryRaw<any[]>(
      `SELECT * FROM {schema}.materials
       WHERE is_active = true
         AND reorder_level IS NOT NULL
         AND quantity_in_stock <= reorder_level
       ORDER BY quantity_in_stock ASC`
    );
  }
}

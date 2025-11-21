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
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.is_active !== undefined) {
      where.is_active = filters.is_active === 'true';
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
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
    return this.tenantPrisma.findMany(tenantId, 'Material', {
      where: {
        AND: [
          { is_active: true },
          { reorder_level: { not: null } },
          {
            OR: [
              { quantity_in_stock: { lte: { reorder_level: true } } },
            ],
          },
        ],
      },
      orderBy: {
        quantity_in_stock: 'asc',
      },
    });
  }
}

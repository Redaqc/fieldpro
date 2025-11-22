import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  async create(createMaterialDto: CreateMaterialDto) {
    // Check if SKU already exists
    if (createMaterialDto.sku) {
      const existing = await this.prisma.material.findUnique({
        where: { sku: createMaterialDto.sku },
      });

      if (existing) {
        throw new ConflictException('Material with this SKU already exists');
      }
    }

    const material = await this.prisma.material.create({
      data: createMaterialDto,
    });

    return material;
  }

  async findAll(page = 1, limit = 20, category?: string, search?: string, lowStock?: boolean) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { sku: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    if (lowStock) {
      where.AND = [
        {
          quantityOnHand: {
            lte: this.prisma.material.fields.minStockLevel,
          },
        },
      ];
    }

    const [materials, total] = await Promise.all([
      this.prisma.material.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.material.count({ where }),
    ]);

    return {
      data: materials,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const material = await this.prisma.material.findUnique({
      where: { id },
    });

    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }

    return material;
  }

  async update(id: string, updateMaterialDto: UpdateMaterialDto) {
    // Check if material exists
    await this.findOne(id);

    // If updating SKU, check it's not taken
    if (updateMaterialDto.sku) {
      const existing = await this.prisma.material.findUnique({
        where: { sku: updateMaterialDto.sku },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('SKU already in use');
      }
    }

    const material = await this.prisma.material.update({
      where: { id },
      data: updateMaterialDto,
    });

    return material;
  }

  async adjustStock(id: string, quantity: number, operation: 'add' | 'subtract') {
    const material = await this.findOne(id);

    let newQuantity: number;

    if (operation === 'add') {
      newQuantity = material.quantityOnHand + quantity;
    } else {
      newQuantity = material.quantityOnHand - quantity;

      if (newQuantity < 0) {
        throw new BadRequestException('Insufficient stock quantity');
      }
    }

    const updatedMaterial = await this.prisma.material.update({
      where: { id },
      data: { quantityOnHand: newQuantity },
    });

    return updatedMaterial;
  }

  async getLowStockItems() {
    const materials = await this.prisma.material.findMany({
      where: {
        quantityOnHand: {
          lte: this.prisma.material.fields.minStockLevel,
        },
      },
      orderBy: { quantityOnHand: 'asc' },
    });

    return materials;
  }

  async getStatistics(category?: string) {
    const where = category ? { category } : {};

    const [totalMaterials, totalValue, lowStockCount, byCategory] = await Promise.all([
      this.prisma.material.count({ where }),
      this.prisma.material.aggregate({
        where,
        _sum: {
          unitPrice: true,
        },
      }),
      this.prisma.material.count({
        where: {
          ...where,
          quantityOnHand: {
            lte: this.prisma.material.fields.minStockLevel,
          },
        },
      }),
      this.prisma.material.groupBy({
        by: ['category'],
        where,
        _count: true,
      }),
    ]);

    return {
      totalMaterials,
      totalValue: totalValue._sum.unitPrice || 0,
      lowStockCount,
      byCategory: byCategory.map((c) => ({
        category: c.category,
        count: c._count,
      })),
    };
  }

  async remove(id: string) {
    // Check if material exists
    await this.findOne(id);

    // Delete material
    await this.prisma.material.delete({
      where: { id },
    });

    return { message: 'Material deleted successfully' };
  }
}

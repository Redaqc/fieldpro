import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';

@Injectable()
export class BundlesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate bundle total price
   */
  private calculateTotalPrice(items: any[], discountPercentage?: number): number {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );

    if (discountPercentage) {
      return subtotal * (1 - discountPercentage / 100);
    }

    return subtotal;
  }

  async create(createBundleDto: CreateBundleDto) {
    // Calculate total price if not provided
    let totalPrice = createBundleDto.totalPrice;
    if (!totalPrice) {
      totalPrice = this.calculateTotalPrice(
        createBundleDto.items,
        createBundleDto.discountPercentage,
      );
    }

    return await this.prisma.bundle.create({
      data: {
        ...createBundleDto,
        totalPrice,
      },
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    active?: boolean,
    search?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (active !== undefined) {
      where.active = active;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.bundle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.bundle.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const bundle = await this.prisma.bundle.findUnique({
      where: { id },
    });

    if (!bundle) {
      throw new NotFoundException('Bundle not found');
    }

    return bundle;
  }

  async update(id: string, updateBundleDto: UpdateBundleDto) {
    await this.findOne(id);

    // Recalculate total price if items or discount changed
    let totalPrice = updateBundleDto.totalPrice;
    if (updateBundleDto.items && !totalPrice) {
      totalPrice = this.calculateTotalPrice(
        updateBundleDto.items,
        updateBundleDto.discountPercentage,
      );
    }

    return await this.prisma.bundle.update({
      where: { id },
      data: {
        ...updateBundleDto,
        totalPrice,
      },
    });
  }

  async toggleActive(id: string) {
    const bundle = await this.findOne(id);

    return await this.prisma.bundle.update({
      where: { id },
      data: { active: !bundle.active },
    });
  }

  async getStatistics() {
    const [total, active, inactive, avgPrice, avgDiscount] = await Promise.all([
      this.prisma.bundle.count(),
      this.prisma.bundle.count({ where: { active: true } }),
      this.prisma.bundle.count({ where: { active: false } }),
      this.prisma.bundle.aggregate({
        _avg: { totalPrice: true },
      }),
      this.prisma.bundle.aggregate({
        where: { discountPercentage: { not: null } },
        _avg: { discountPercentage: true },
      }),
    ]);

    return {
      totalBundles: total,
      active,
      inactive,
      averagePrice: avgPrice._avg.totalPrice || 0,
      averageDiscount: avgDiscount._avg.discountPercentage || 0,
    };
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.bundle.delete({
      where: { id },
    });

    return { message: 'Bundle deleted successfully' };
  }
}

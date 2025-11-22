import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { UpdatePriceListDto } from './dto/update-price-list.dto';

@Injectable()
export class PriceListsService {
  constructor(private prisma: PrismaService) {}

  async create(createPriceListDto: CreatePriceListDto) {
    return await this.prisma.priceList.create({
      data: createPriceListDto,
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    active?: boolean,
    category?: string,
    search?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (active !== undefined) {
      where.active = active;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.priceList.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.priceList.count({ where }),
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
    const priceList = await this.prisma.priceList.findUnique({
      where: { id },
    });

    if (!priceList) {
      throw new NotFoundException('Price list item not found');
    }

    return priceList;
  }

  async update(id: string, updatePriceListDto: UpdatePriceListDto) {
    await this.findOne(id);

    return await this.prisma.priceList.update({
      where: { id },
      data: updatePriceListDto,
    });
  }

  async toggleActive(id: string) {
    const priceList = await this.findOne(id);

    return await this.prisma.priceList.update({
      where: { id },
      data: { active: !priceList.active },
    });
  }

  async getStatistics(category?: string) {
    const where = category ? { category } : {};

    const [total, active, inactive, avgPrice, byCategory] = await Promise.all([
      this.prisma.priceList.count({ where }),
      this.prisma.priceList.count({ where: { ...where, active: true } }),
      this.prisma.priceList.count({ where: { ...where, active: false } }),
      this.prisma.priceList.aggregate({
        where,
        _avg: { unitPrice: true },
      }),
      this.prisma.priceList.groupBy({
        by: ['category'],
        where,
        _count: true,
        _avg: { unitPrice: true },
      }),
    ]);

    return {
      totalItems: total,
      active,
      inactive,
      averagePrice: avgPrice._avg.unitPrice || 0,
      byCategory: byCategory.map((item) => ({
        category: item.category,
        count: item._count,
        averagePrice: item._avg.unitPrice || 0,
      })),
    };
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.priceList.delete({
      where: { id },
    });

    return { message: 'Price list item deleted successfully' };
  }
}

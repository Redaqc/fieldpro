import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGPSZoneDto } from './dto/create-gps-zone.dto';
import { UpdateGPSZoneDto } from './dto/update-gps-zone.dto';

@Injectable()
export class GPSZonesService {
  constructor(private prisma: PrismaService) {}

  async create(createGPSZoneDto: CreateGPSZoneDto) {
    return await this.prisma.gPSZone.create({
      data: createGPSZoneDto,
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    zoneType?: string,
    active?: boolean,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (zoneType) {
      where.zoneType = zoneType;
    }

    if (active !== undefined) {
      where.active = active;
    }

    const [data, total] = await Promise.all([
      this.prisma.gPSZone.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.gPSZone.count({ where }),
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
    const gpsZone = await this.prisma.gPSZone.findUnique({
      where: { id },
      include: {
        alerts: {
          take: 10,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!gpsZone) {
      throw new NotFoundException('GPS zone not found');
    }

    return gpsZone;
  }

  async update(id: string, updateGPSZoneDto: UpdateGPSZoneDto) {
    await this.findOne(id);

    return await this.prisma.gPSZone.update({
      where: { id },
      data: updateGPSZoneDto,
    });
  }

  async toggleActive(id: string) {
    const zone = await this.findOne(id);

    return await this.prisma.gPSZone.update({
      where: { id },
      data: { active: !zone.active },
    });
  }

  async getStatistics() {
    const [total, active, byType] = await Promise.all([
      this.prisma.gPSZone.count(),
      this.prisma.gPSZone.count({ where: { active: true } }),
      this.prisma.gPSZone.groupBy({
        by: ['zoneType'],
        _count: true,
      }),
    ]);

    return {
      totalZones: total,
      active,
      inactive: total - active,
      byType: byType.map((item) => ({
        type: item.zoneType,
        count: item._count,
      })),
    };
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.gPSZone.delete({
      where: { id },
    });

    return { message: 'GPS zone deleted successfully' };
  }
}

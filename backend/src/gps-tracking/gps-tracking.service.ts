import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGPSTrackingDto } from './dto/create-gps-tracking.dto';

@Injectable()
export class GPSTrackingService {
  constructor(private prisma: PrismaService) {}

  async create(createGPSTrackingDto: CreateGPSTrackingDto) {
    // Verify technician exists
    const technician = await this.prisma.technician.findUnique({
      where: { id: createGPSTrackingDto.technicianId },
    });

    if (!technician) {
      throw new NotFoundException('Technician not found');
    }

    return await this.prisma.gPSTracking.create({
      data: createGPSTrackingDto,
      include: {
        technician: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    technicianId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (technicianId) {
      where.technicianId = technicianId;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.gPSTracking.findMany({
        where,
        skip,
        take: limit,
        include: {
          technician: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.gPSTracking.count({ where }),
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
    const gpsTracking = await this.prisma.gPSTracking.findUnique({
      where: { id },
      include: {
        technician: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!gpsTracking) {
      throw new NotFoundException('GPS tracking record not found');
    }

    return gpsTracking;
  }

  async getLatestByTechnician(technicianId: string) {
    return await this.prisma.gPSTracking.findFirst({
      where: { technicianId },
      orderBy: { timestamp: 'desc' },
      include: {
        technician: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.gPSTracking.delete({
      where: { id },
    });

    return { message: 'GPS tracking record deleted successfully' };
  }
}

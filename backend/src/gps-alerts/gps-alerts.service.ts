import { Injectable, NotFoundException } from '@nestjs/common';
import { AlertType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGPSAlertDto } from './dto/create-gps-alert.dto';
import { UpdateGPSAlertDto } from './dto/update-gps-alert.dto';

@Injectable()
export class GPSAlertsService {
  constructor(private prisma: PrismaService) {}

  async create(createGPSAlertDto: CreateGPSAlertDto) {
    // Verify technician exists
    const technician = await this.prisma.technician.findUnique({
      where: { id: createGPSAlertDto.technicianId },
    });

    if (!technician) {
      throw new NotFoundException('Technician not found');
    }

    // Verify zone if provided
    if (createGPSAlertDto.zoneId) {
      const zone = await this.prisma.gPSZone.findUnique({
        where: { id: createGPSAlertDto.zoneId },
      });

      if (!zone) {
        throw new NotFoundException('GPS zone not found');
      }
    }

    return await this.prisma.gPSAlert.create({
      data: createGPSAlertDto,
      include: {
        technician: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        zone: true,
      },
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    technicianId?: string,
    zoneId?: string,
    alertType?: AlertType,
    acknowledged?: boolean,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (technicianId) {
      where.technicianId = technicianId;
    }

    if (zoneId) {
      where.zoneId = zoneId;
    }

    if (alertType) {
      where.alertType = alertType;
    }

    if (acknowledged !== undefined) {
      where.acknowledged = acknowledged;
    }

    const [data, total] = await Promise.all([
      this.prisma.gPSAlert.findMany({
        where,
        skip,
        take: limit,
        include: {
          technician: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true } },
            },
          },
          zone: true,
        },
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.gPSAlert.count({ where }),
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
    const gpsAlert = await this.prisma.gPSAlert.findUnique({
      where: { id },
      include: {
        technician: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        zone: true,
      },
    });

    if (!gpsAlert) {
      throw new NotFoundException('GPS alert not found');
    }

    return gpsAlert;
  }

  async update(id: string, updateGPSAlertDto: UpdateGPSAlertDto) {
    await this.findOne(id);

    return await this.prisma.gPSAlert.update({
      where: { id },
      data: updateGPSAlertDto,
      include: {
        technician: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        zone: true,
      },
    });
  }

  async acknowledge(id: string) {
    await this.findOne(id);

    return await this.prisma.gPSAlert.update({
      where: { id },
      data: { acknowledged: true },
      include: {
        technician: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        zone: true,
      },
    });
  }

  async getStatistics(technicianId?: string) {
    const where = technicianId ? { technicianId } : {};

    const [total, acknowledged, unacknowledged, byType] = await Promise.all([
      this.prisma.gPSAlert.count({ where }),
      this.prisma.gPSAlert.count({ where: { ...where, acknowledged: true } }),
      this.prisma.gPSAlert.count({ where: { ...where, acknowledged: false } }),
      this.prisma.gPSAlert.groupBy({
        by: ['alertType'],
        where,
        _count: true,
      }),
    ]);

    return {
      totalAlerts: total,
      acknowledged,
      unacknowledged,
      byType: byType.map((item) => ({
        type: item.alertType,
        count: item._count,
      })),
    };
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.gPSAlert.delete({
      where: { id },
    });

    return { message: 'GPS alert deleted successfully' };
  }
}

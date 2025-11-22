import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceScheduleDto } from './dto/create-maintenance-schedule.dto';
import { UpdateMaintenanceScheduleDto } from './dto/update-maintenance-schedule.dto';

@Injectable()
export class MaintenanceSchedulesService {
  constructor(private prisma: PrismaService) {}

  async create(createMaintenanceScheduleDto: CreateMaintenanceScheduleDto) {
    // Verify asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: createMaintenanceScheduleDto.assetId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    // Verify technician if assigned
    if (createMaintenanceScheduleDto.assignedTo) {
      const technician = await this.prisma.technician.findUnique({
        where: { id: createMaintenanceScheduleDto.assignedTo },
      });

      if (!technician) {
        throw new NotFoundException('Technician not found');
      }
    }

    return await this.prisma.maintenanceSchedule.create({
      data: {
        ...createMaintenanceScheduleDto,
        nextMaintenanceDate: new Date(
          createMaintenanceScheduleDto.nextMaintenanceDate,
        ),
        lastMaintenanceDate: createMaintenanceScheduleDto.lastMaintenanceDate
          ? new Date(createMaintenanceScheduleDto.lastMaintenanceDate)
          : null,
      },
      include: {
        asset: true,
      },
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    assetId?: string,
    active?: boolean,
    assignedTo?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (assetId) {
      where.assetId = assetId;
    }

    if (active !== undefined) {
      where.active = active;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    const [data, total] = await Promise.all([
      this.prisma.maintenanceSchedule.findMany({
        where,
        skip,
        take: limit,
        include: {
          asset: true,
        },
        orderBy: {
          nextMaintenanceDate: 'asc',
        },
      }),
      this.prisma.maintenanceSchedule.count({ where }),
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
    const maintenanceSchedule = await this.prisma.maintenanceSchedule.findUnique(
      {
        where: { id },
        include: {
          asset: true,
        },
      },
    );

    if (!maintenanceSchedule) {
      throw new NotFoundException('Maintenance schedule not found');
    }

    return maintenanceSchedule;
  }

  async update(
    id: string,
    updateMaintenanceScheduleDto: UpdateMaintenanceScheduleDto,
  ) {
    await this.findOne(id);

    // Verify asset if being updated
    if (updateMaintenanceScheduleDto.assetId) {
      const asset = await this.prisma.asset.findUnique({
        where: { id: updateMaintenanceScheduleDto.assetId },
      });

      if (!asset) {
        throw new NotFoundException('Asset not found');
      }
    }

    // Verify technician if being updated
    if (updateMaintenanceScheduleDto.assignedTo) {
      const technician = await this.prisma.technician.findUnique({
        where: { id: updateMaintenanceScheduleDto.assignedTo },
      });

      if (!technician) {
        throw new NotFoundException('Technician not found');
      }
    }

    return await this.prisma.maintenanceSchedule.update({
      where: { id },
      data: {
        ...updateMaintenanceScheduleDto,
        nextMaintenanceDate: updateMaintenanceScheduleDto.nextMaintenanceDate
          ? new Date(updateMaintenanceScheduleDto.nextMaintenanceDate)
          : undefined,
        lastMaintenanceDate: updateMaintenanceScheduleDto.lastMaintenanceDate
          ? new Date(updateMaintenanceScheduleDto.lastMaintenanceDate)
          : undefined,
      },
      include: {
        asset: true,
      },
    });
  }

  async completeMaintenance(id: string, nextMaintenanceDate: string) {
    await this.findOne(id);

    return await this.prisma.maintenanceSchedule.update({
      where: { id },
      data: {
        lastMaintenanceDate: new Date(),
        nextMaintenanceDate: new Date(nextMaintenanceDate),
      },
      include: {
        asset: true,
      },
    });
  }

  async toggleActive(id: string) {
    const schedule = await this.findOne(id);

    return await this.prisma.maintenanceSchedule.update({
      where: { id },
      data: { active: !schedule.active },
      include: {
        asset: true,
      },
    });
  }

  async getStatistics(assetId?: string) {
    const where = assetId ? { assetId } : {};

    const [total, active, overdue, byType] = await Promise.all([
      this.prisma.maintenanceSchedule.count({ where }),
      this.prisma.maintenanceSchedule.count({
        where: { ...where, active: true },
      }),
      this.prisma.maintenanceSchedule.count({
        where: {
          ...where,
          active: true,
          nextMaintenanceDate: { lt: new Date() },
        },
      }),
      this.prisma.maintenanceSchedule.groupBy({
        by: ['maintenanceType'],
        where,
        _count: true,
      }),
    ]);

    return {
      totalSchedules: total,
      active,
      overdue,
      byType: byType.map((item) => ({
        type: item.maintenanceType,
        count: item._count,
      })),
    };
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.maintenanceSchedule.delete({
      where: { id },
    });

    return { message: 'Maintenance schedule deleted successfully' };
  }
}

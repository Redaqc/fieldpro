import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';

@Injectable()
export class TimeEntriesService {
  constructor(private prisma: PrismaService) {}

  async create(createTimeEntryDto: CreateTimeEntryDto) {
    // Verify technician exists
    const technician = await this.prisma.technician.findUnique({
      where: { id: createTimeEntryDto.technicianId },
    });

    if (!technician) {
      throw new NotFoundException('Technician not found');
    }

    // Verify job exists if provided
    if (createTimeEntryDto.jobId) {
      const job = await this.prisma.job.findUnique({
        where: { id: createTimeEntryDto.jobId },
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }
    }

    // Calculate duration if endTime is provided but duration is not
    let durationHours = createTimeEntryDto.durationHours;
    if (!durationHours && createTimeEntryDto.endTime) {
      const start = new Date(createTimeEntryDto.startTime);
      const end = new Date(createTimeEntryDto.endTime);
      durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }

    // Calculate total cost if hourly rate and duration are available
    let totalCost = createTimeEntryDto.totalCost;
    if (!totalCost && createTimeEntryDto.hourlyRate && durationHours) {
      totalCost = createTimeEntryDto.hourlyRate * durationHours;
    }

    const timeEntry = await this.prisma.timeEntry.create({
      data: {
        ...createTimeEntryDto,
        startTime: new Date(createTimeEntryDto.startTime),
        endTime: createTimeEntryDto.endTime ? new Date(createTimeEntryDto.endTime) : null,
        durationHours,
        totalCost,
      },
      include: {
        technician: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        job: true,
      },
    });

    return timeEntry;
  }

  async findAll(
    page = 1,
    limit = 20,
    technicianId?: string,
    jobId?: string,
    billable?: boolean,
    startDate?: string,
    endDate?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (technicianId) {
      where.technicianId = technicianId;
    }

    if (jobId) {
      where.jobId = jobId;
    }

    if (billable !== undefined) {
      where.billable = billable;
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        where.startTime.gte = new Date(startDate);
      }
      if (endDate) {
        where.startTime.lte = new Date(endDate);
      }
    }

    const [timeEntries, total] = await Promise.all([
      this.prisma.timeEntry.findMany({
        where,
        skip,
        take: limit,
        include: {
          technician: {
            include: {
              user: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
            },
          },
          job: true,
        },
        orderBy: { startTime: 'desc' },
      }),
      this.prisma.timeEntry.count({ where }),
    ]);

    return {
      data: timeEntries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const timeEntry = await this.prisma.timeEntry.findUnique({
      where: { id },
      include: {
        technician: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        job: true,
      },
    });

    if (!timeEntry) {
      throw new NotFoundException(`TimeEntry with ID ${id} not found`);
    }

    return timeEntry;
  }

  async update(id: string, updateTimeEntryDto: UpdateTimeEntryDto) {
    // Check if time entry exists
    await this.findOne(id);

    // Recalculate duration if endTime is updated
    let durationHours = updateTimeEntryDto.durationHours;
    if (updateTimeEntryDto.endTime && updateTimeEntryDto.startTime) {
      const start = new Date(updateTimeEntryDto.startTime);
      const end = new Date(updateTimeEntryDto.endTime);
      durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }

    // Recalculate total cost if hourly rate or duration changed
    let totalCost = updateTimeEntryDto.totalCost;
    if (updateTimeEntryDto.hourlyRate && durationHours) {
      totalCost = updateTimeEntryDto.hourlyRate * durationHours;
    }

    const timeEntry = await this.prisma.timeEntry.update({
      where: { id },
      data: {
        ...updateTimeEntryDto,
        startTime: updateTimeEntryDto.startTime ? new Date(updateTimeEntryDto.startTime) : undefined,
        endTime: updateTimeEntryDto.endTime ? new Date(updateTimeEntryDto.endTime) : undefined,
        durationHours,
        totalCost,
      },
      include: {
        technician: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        job: true,
      },
    });

    return timeEntry;
  }

  async clockOut(id: string, endTime?: Date) {
    const timeEntry = await this.findOne(id);

    if (timeEntry.endTime) {
      throw new BadRequestException('Time entry already clocked out');
    }

    const end = endTime || new Date();
    const start = new Date(timeEntry.startTime);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    let totalCost = timeEntry.totalCost;
    if (timeEntry.hourlyRate) {
      totalCost = timeEntry.hourlyRate * durationHours;
    }

    const updatedEntry = await this.prisma.timeEntry.update({
      where: { id },
      data: {
        endTime: end,
        durationHours,
        totalCost,
      },
      include: {
        technician: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        job: true,
      },
    });

    return updatedEntry;
  }

  async getStatistics(technicianId?: string, jobId?: string, startDate?: string, endDate?: string) {
    const where: any = {};

    if (technicianId) {
      where.technicianId = technicianId;
    }

    if (jobId) {
      where.jobId = jobId;
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        where.startTime.gte = new Date(startDate);
      }
      if (endDate) {
        where.startTime.lte = new Date(endDate);
      }
    }

    const [
      totalEntries,
      totalHours,
      billableHours,
      totalCost,
      billableCost,
    ] = await Promise.all([
      this.prisma.timeEntry.count({ where }),
      this.prisma.timeEntry.aggregate({
        where,
        _sum: { durationHours: true },
      }),
      this.prisma.timeEntry.aggregate({
        where: { ...where, billable: true },
        _sum: { durationHours: true },
      }),
      this.prisma.timeEntry.aggregate({
        where,
        _sum: { totalCost: true },
      }),
      this.prisma.timeEntry.aggregate({
        where: { ...where, billable: true },
        _sum: { totalCost: true },
      }),
    ]);

    return {
      totalEntries,
      totalHours: totalHours._sum.durationHours || 0,
      billableHours: billableHours._sum.durationHours || 0,
      nonBillableHours: (totalHours._sum.durationHours || 0) - (billableHours._sum.durationHours || 0),
      totalCost: totalCost._sum.totalCost || 0,
      billableCost: billableCost._sum.totalCost || 0,
    };
  }

  async remove(id: string) {
    // Check if time entry exists
    await this.findOne(id);

    // Delete time entry
    await this.prisma.timeEntry.delete({
      where: { id },
    });

    return { message: 'TimeEntry deleted successfully' };
  }
}

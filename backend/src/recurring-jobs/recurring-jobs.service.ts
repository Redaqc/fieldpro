import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RecurringFrequency } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecurringJobDto } from './dto/create-recurring-job.dto';
import { UpdateRecurringJobDto } from './dto/update-recurring-job.dto';

@Injectable()
export class RecurringJobsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate next occurrence based on frequency
   */
  private calculateNextOccurrence(
    startDate: Date,
    frequency: RecurringFrequency,
    frequencyValue: number = 1,
  ): Date {
    const next = new Date(startDate);

    switch (frequency) {
      case RecurringFrequency.DAILY:
        next.setDate(next.getDate() + frequencyValue);
        break;
      case RecurringFrequency.WEEKLY:
        next.setDate(next.getDate() + frequencyValue * 7);
        break;
      case RecurringFrequency.MONTHLY:
        next.setMonth(next.getMonth() + frequencyValue);
        break;
      case RecurringFrequency.QUARTERLY:
        next.setMonth(next.getMonth() + frequencyValue * 3);
        break;
      case RecurringFrequency.YEARLY:
        next.setFullYear(next.getFullYear() + frequencyValue);
        break;
    }

    return next;
  }

  /**
   * Create a new recurring job
   */
  async create(createRecurringJobDto: CreateRecurringJobDto) {
    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: createRecurringJobDto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Validate dates
    const startDate = new Date(createRecurringJobDto.startDate);
    const endDate = createRecurringJobDto.endDate
      ? new Date(createRecurringJobDto.endDate)
      : null;

    if (endDate && endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Calculate next occurrence if not provided
    let nextOccurrence: Date;
    if (createRecurringJobDto.nextOccurrence) {
      nextOccurrence = new Date(createRecurringJobDto.nextOccurrence);
    } else {
      nextOccurrence = this.calculateNextOccurrence(
        startDate,
        createRecurringJobDto.frequency,
        createRecurringJobDto.frequencyValue || 1,
      );
    }

    // Validate assigned technicians if provided
    if (createRecurringJobDto.assignedTechnicians?.length) {
      const technicians = await this.prisma.technician.findMany({
        where: {
          id: { in: createRecurringJobDto.assignedTechnicians },
        },
      });

      if (technicians.length !== createRecurringJobDto.assignedTechnicians.length) {
        throw new NotFoundException('One or more technicians not found');
      }
    }

    // Create recurring job
    const recurringJob = await this.prisma.recurringJob.create({
      data: {
        jobTemplateId: createRecurringJobDto.jobTemplateId,
        customerId: createRecurringJobDto.customerId,
        frequency: createRecurringJobDto.frequency,
        frequencyValue: createRecurringJobDto.frequencyValue || 1,
        startDate,
        endDate,
        nextOccurrence,
        assignedTechnicians: createRecurringJobDto.assignedTechnicians || [],
        autoAssign: createRecurringJobDto.autoAssign ?? false,
        active: createRecurringJobDto.active ?? true,
      },
    });

    return recurringJob;
  }

  /**
   * Get all recurring jobs with filters and pagination
   */
  async findAll(
    page: number = 1,
    limit: number = 20,
    active?: boolean,
    customerId?: string,
    frequency?: RecurringFrequency,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (active !== undefined) {
      where.active = active;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (frequency) {
      where.frequency = frequency;
    }

    const [data, total] = await Promise.all([
      this.prisma.recurringJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          nextOccurrence: 'asc',
        },
      }),
      this.prisma.recurringJob.count({ where }),
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

  /**
   * Get recurring job by ID
   */
  async findOne(id: string) {
    const recurringJob = await this.prisma.recurringJob.findUnique({
      where: { id },
    });

    if (!recurringJob) {
      throw new NotFoundException('Recurring job not found');
    }

    return recurringJob;
  }

  /**
   * Update recurring job
   */
  async update(id: string, updateRecurringJobDto: UpdateRecurringJobDto) {
    // Verify recurring job exists
    await this.findOne(id);

    // If updating customer, verify customer exists
    if (updateRecurringJobDto.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: updateRecurringJobDto.customerId },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
    }

    // Validate dates if both are provided
    if (updateRecurringJobDto.startDate && updateRecurringJobDto.endDate) {
      const startDate = new Date(updateRecurringJobDto.startDate);
      const endDate = new Date(updateRecurringJobDto.endDate);

      if (endDate <= startDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    // Validate assigned technicians if provided
    if (updateRecurringJobDto.assignedTechnicians?.length) {
      const technicians = await this.prisma.technician.findMany({
        where: {
          id: { in: updateRecurringJobDto.assignedTechnicians },
        },
      });

      if (technicians.length !== updateRecurringJobDto.assignedTechnicians.length) {
        throw new NotFoundException('One or more technicians not found');
      }
    }

    // Update recurring job
    const recurringJob = await this.prisma.recurringJob.update({
      where: { id },
      data: {
        ...updateRecurringJobDto,
        startDate: updateRecurringJobDto.startDate
          ? new Date(updateRecurringJobDto.startDate)
          : undefined,
        endDate: updateRecurringJobDto.endDate
          ? new Date(updateRecurringJobDto.endDate)
          : undefined,
        nextOccurrence: updateRecurringJobDto.nextOccurrence
          ? new Date(updateRecurringJobDto.nextOccurrence)
          : undefined,
      },
    });

    return recurringJob;
  }

  /**
   * Update next occurrence after job generation
   */
  async updateNextOccurrence(id: string) {
    const recurringJob = await this.findOne(id);

    const nextOccurrence = this.calculateNextOccurrence(
      recurringJob.nextOccurrence,
      recurringJob.frequency,
      recurringJob.frequencyValue,
    );

    // Check if next occurrence exceeds end date
    if (recurringJob.endDate && nextOccurrence > recurringJob.endDate) {
      // Deactivate the recurring job
      return await this.prisma.recurringJob.update({
        where: { id },
        data: { active: false },
      });
    }

    return await this.prisma.recurringJob.update({
      where: { id },
      data: { nextOccurrence },
    });
  }

  /**
   * Toggle active status
   */
  async toggleActive(id: string) {
    const recurringJob = await this.findOne(id);

    return await this.prisma.recurringJob.update({
      where: { id },
      data: { active: !recurringJob.active },
    });
  }

  /**
   * Get recurring job statistics
   */
  async getStatistics(customerId?: string) {
    const where = customerId ? { customerId } : {};

    const [total, active, inactive, byFrequency] = await Promise.all([
      this.prisma.recurringJob.count({ where }),
      this.prisma.recurringJob.count({ where: { ...where, active: true } }),
      this.prisma.recurringJob.count({ where: { ...where, active: false } }),
      this.prisma.recurringJob.groupBy({
        by: ['frequency'],
        where,
        _count: true,
      }),
    ]);

    const frequencyStats = byFrequency.map((item) => ({
      frequency: item.frequency,
      count: item._count,
    }));

    return {
      totalRecurringJobs: total,
      active,
      inactive,
      byFrequency: frequencyStats,
    };
  }

  /**
   * Remove recurring job
   */
  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.recurringJob.delete({
      where: { id },
    });

    return { message: 'Recurring job deleted successfully' };
  }
}

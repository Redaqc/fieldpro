import { Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';

@Injectable()
export class TechniciansService {
  constructor(private tenantPrisma: TenantPrismaService) {}

  async create(tenantId: string, createDto: CreateTechnicianDto) {
    return this.tenantPrisma.create(tenantId, 'Technician', {
      data: {
        ...createDto,
        is_active: createDto.is_active !== undefined ? createDto.is_active : true,
      },
    });
  }

  async findAll(tenantId: string, filters?: any) {
    const where: any = {};

    if (filters?.is_active !== undefined) {
      where.is_active = filters.is_active === 'true';
    }

    if (filters?.skills) {
      where.skills = {
        hasSome: Array.isArray(filters.skills) ? filters.skills : [filters.skills],
      };
    }

    return this.tenantPrisma.findMany(tenantId, 'Technician', {
      where,
      orderBy: {
        first_name: 'asc',
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.tenantPrisma.findOne(tenantId, 'Technician', {
      where: { id },
      include: {
        assigned_jobs: {
          where: {
            status: {
              in: ['scheduled', 'in_progress'],
            },
          },
          take: 10,
        },
        assigned_service_calls: {
          where: {
            status: {
              in: ['scheduled', 'in_progress'],
            },
          },
          take: 10,
        },
      },
    });
  }

  async update(tenantId: string, id: string, updateDto: UpdateTechnicianDto) {
    return this.tenantPrisma.update(tenantId, 'Technician', {
      where: { id },
      data: updateDto,
    });
  }

  async delete(tenantId: string, id: string) {
    return this.tenantPrisma.delete(tenantId, 'Technician', {
      where: { id },
    });
  }

  async getSchedule(tenantId: string, id: string, startDate: Date, endDate: Date) {
    const jobs = await this.tenantPrisma.findMany(tenantId, 'Job', {
      where: {
        assigned_to: id,
        scheduled_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        customer: true,
      },
      orderBy: {
        scheduled_date: 'asc',
      },
    });

    const serviceCalls = await this.tenantPrisma.findMany(tenantId, 'ServiceCall', {
      where: {
        assigned_to: id,
        scheduled_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        customer: true,
      },
      orderBy: {
        scheduled_date: 'asc',
      },
    });

    return {
      jobs,
      service_calls: serviceCalls,
    };
  }

  async getAvailableTechnicians(tenantId: string, date: Date) {
    // Get all active technicians
    const technicians = await this.findAll(tenantId, { is_active: true });

    // For each technician, check their schedule for the given date
    const availabilityPromises = technicians.map(async (tech) => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const schedule = await this.getSchedule(tenantId, tech.id, startOfDay, endOfDay);

      return {
        ...tech,
        scheduled_count: schedule.jobs.length + schedule.service_calls.length,
        is_available: schedule.jobs.length + schedule.service_calls.length < 5, // Max 5 per day
      };
    });

    return Promise.all(availabilityPromises);
  }
}

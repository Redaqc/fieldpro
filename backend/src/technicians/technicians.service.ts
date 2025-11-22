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
    // ✅ FIXED: Handle skills filter with queryRaw since TenantPrismaService doesn't support hasSome
    if (filters?.skills) {
      const params: any[] = [];
      let paramIndex = 1;
      const skillsArray = Array.isArray(filters.skills) ? filters.skills : [filters.skills];

      let query = `SELECT * FROM {schema}.technicians WHERE skills && $${paramIndex}`;
      params.push(skillsArray);
      paramIndex++;

      // Add is_active filter if provided
      if (filters.is_active !== undefined) {
        query += ` AND is_active = $${paramIndex}`;
        params.push(filters.is_active === 'true');
        paramIndex++;
      }

      query += ` ORDER BY first_name ASC`;

      return this.tenantPrisma.queryRaw<any[]>(query, params);
    }

    // No skills filter - use simple where clause
    const where: any = {};

    if (filters?.is_active !== undefined) {
      where.is_active = filters.is_active === 'true';
    }

    return this.tenantPrisma.findMany(tenantId, 'Technician', {
      where,
      orderBy: {
        first_name: 'asc',
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    // ✅ FIXED: Removed unsupported include parameter
    // Relations must be fetched separately if needed
    return this.tenantPrisma.findOne(tenantId, 'Technician', {
      where: { id },
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
    // ✅ FIXED: Use queryRaw for date comparisons since TenantPrismaService doesn't support gte/lte/include
    const jobs = await this.tenantPrisma.queryRaw<any[]>(
      `SELECT * FROM {schema}.jobs
       WHERE assigned_to = $1
         AND scheduled_date >= $2
         AND scheduled_date <= $3
       ORDER BY scheduled_date ASC`,
      [id, startDate, endDate]
    );

    const serviceCalls = await this.tenantPrisma.queryRaw<any[]>(
      `SELECT * FROM {schema}.service_calls
       WHERE assigned_to = $1
         AND scheduled_date >= $2
         AND scheduled_date <= $3
       ORDER BY scheduled_date ASC`,
      [id, startDate, endDate]
    );

    return {
      jobs,
      service_calls: serviceCalls,
    };
  }

  async getAvailableTechnicians(tenantId: string, date: Date) {
    // ✅ FIXED: Use single query with LEFT JOINs to eliminate N+1 problem
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Single query with aggregation to get technician availability
    const result = await this.tenantPrisma.queryRaw<any[]>(`
      SELECT
        t.*,
        COALESCE(COUNT(DISTINCT j.id), 0) + COALESCE(COUNT(DISTINCT sc.id), 0) as scheduled_count,
        (COALESCE(COUNT(DISTINCT j.id), 0) + COALESCE(COUNT(DISTINCT sc.id), 0)) < 5 as is_available
      FROM {schema}.technicians t
      LEFT JOIN {schema}.jobs j
        ON j.assigned_to = t.id
        AND j.scheduled_date >= $1
        AND j.scheduled_date <= $2
      LEFT JOIN {schema}.service_calls sc
        ON sc.assigned_to = t.id
        AND sc.scheduled_date >= $1
        AND sc.scheduled_date <= $2
      WHERE t.is_active = true
      GROUP BY t.id
      ORDER BY t.first_name ASC
    `, [startOfDay, endOfDay]);

    return result;
  }
}

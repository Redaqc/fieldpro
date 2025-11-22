import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateTimeEntryDto, TimeEntryType } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';

@Injectable()
export class TimeTrackingService {
  private readonly logger = new Logger(TimeTrackingService.name);

  constructor(private tenantPrisma: TenantPrismaService) {}

  /**
   * Create a new time entry
   */
  async create(tenantId: string, createDto: CreateTimeEntryDto) {
    // Validate that end_time is after start_time if provided
    if (createDto.end_time) {
      const startTime = new Date(createDto.start_time);
      const endTime = new Date(createDto.end_time);

      if (endTime <= startTime) {
        throw new BadRequestException('End time must be after start time');
      }
    }

    // Calculate duration if end_time is provided
    let duration_minutes: number | null = null;
    if (createDto.end_time) {
      const startTime = new Date(createDto.start_time);
      const endTime = new Date(createDto.end_time);
      duration_minutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
    }

    const timeEntry = await this.tenantPrisma.create(tenantId, 'TimeEntry', {
      data: {
        user_id: createDto.user_id,
        type: createDto.type,
        start_time: new Date(createDto.start_time),
        end_time: createDto.end_time ? new Date(createDto.end_time) : null,
        duration_minutes,
        job_id: createDto.job_id,
        service_call_id: createDto.service_call_id,
        description: createDto.description,
        is_billable: createDto.is_billable ?? true,
        hourly_rate: createDto.hourly_rate,
        notes: createDto.notes,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return timeEntry;
  }

  /**
   * Get all time entries with optional filters
   */
  async findAll(tenantId: string, filters?: any) {
    const params: any[] = [];
    let paramIndex = 1;
    let query = `SELECT * FROM {schema}.time_entries WHERE 1=1`;

    if (filters?.user_id) {
      query += ` AND user_id = $${paramIndex}`;
      params.push(filters.user_id);
      paramIndex++;
    }

    if (filters?.job_id) {
      query += ` AND job_id = $${paramIndex}`;
      params.push(filters.job_id);
      paramIndex++;
    }

    if (filters?.service_call_id) {
      query += ` AND service_call_id = $${paramIndex}`;
      params.push(filters.service_call_id);
      paramIndex++;
    }

    if (filters?.type) {
      query += ` AND type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }

    if (filters?.is_billable !== undefined) {
      query += ` AND is_billable = $${paramIndex}`;
      params.push(filters.is_billable === 'true' || filters.is_billable === true);
      paramIndex++;
    }

    if (filters?.start_date) {
      query += ` AND start_time >= $${paramIndex}`;
      params.push(new Date(filters.start_date));
      paramIndex++;
    }

    if (filters?.end_date) {
      query += ` AND start_time <= $${paramIndex}`;
      params.push(new Date(filters.end_date));
      paramIndex++;
    }

    // Filter for active (in-progress) time entries
    if (filters?.is_active === 'true' || filters?.is_active === true) {
      query += ` AND end_time IS NULL`;
    }

    query += ` ORDER BY start_time DESC`;

    return this.tenantPrisma.queryRaw<any[]>(query, params);
  }

  /**
   * Get a single time entry
   */
  async findOne(tenantId: string, id: string) {
    const timeEntry = await this.tenantPrisma.findOne(tenantId, 'TimeEntry', {
      where: { id },
    });

    if (!timeEntry) {
      throw new NotFoundException('Time entry not found');
    }

    return timeEntry;
  }

  /**
   * Update a time entry
   */
  async update(tenantId: string, id: string, updateDto: UpdateTimeEntryDto) {
    await this.findOne(tenantId, id);

    // Validate times if both are provided
    if (updateDto.start_time && updateDto.end_time) {
      const startTime = new Date(updateDto.start_time);
      const endTime = new Date(updateDto.end_time);

      if (endTime <= startTime) {
        throw new BadRequestException('End time must be after start time');
      }
    }

    const updateData: any = { ...updateDto };

    // Recalculate duration if times are updated
    if (updateDto.start_time || updateDto.end_time) {
      const existing = await this.findOne(tenantId, id);
      const startTime = new Date(updateDto.start_time || existing.start_time);
      const endTime = updateDto.end_time ? new Date(updateDto.end_time) : (existing.end_time ? new Date(existing.end_time) : null);

      if (endTime) {
        updateData.duration_minutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
      }
    }

    updateData.updated_at = new Date();

    return this.tenantPrisma.update(tenantId, 'TimeEntry', {
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete a time entry
   */
  async delete(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.tenantPrisma.delete(tenantId, 'TimeEntry', {
      where: { id },
    });
  }

  /**
   * Clock in - Start a new time entry
   */
  async clockIn(tenantId: string, userId: string, type: TimeEntryType = TimeEntryType.GENERAL, metadata?: any) {
    // Check if user already has an active time entry
    const activeEntries = await this.findAll(tenantId, {
      user_id: userId,
      is_active: true,
    });

    if (activeEntries.length > 0) {
      throw new BadRequestException('User already has an active time entry. Please clock out first.');
    }

    return this.create(tenantId, {
      user_id: userId,
      type,
      start_time: new Date().toISOString(),
      job_id: metadata?.job_id,
      service_call_id: metadata?.service_call_id,
      description: metadata?.description,
      is_billable: metadata?.is_billable ?? true,
      hourly_rate: metadata?.hourly_rate,
    });
  }

  /**
   * Clock out - End the active time entry
   */
  async clockOut(tenantId: string, userId: string, notes?: string) {
    const activeEntries = await this.findAll(tenantId, {
      user_id: userId,
      is_active: true,
    });

    if (activeEntries.length === 0) {
      throw new NotFoundException('No active time entry found for user');
    }

    const activeEntry = activeEntries[0];

    return this.update(tenantId, activeEntry.id, {
      end_time: new Date().toISOString(),
      notes,
    });
  }

  /**
   * Get active time entry for a user
   */
  async getActiveEntry(tenantId: string, userId: string) {
    const activeEntries = await this.findAll(tenantId, {
      user_id: userId,
      is_active: true,
    });

    return activeEntries.length > 0 ? activeEntries[0] : null;
  }

  /**
   * Get time summary for a user within a date range
   */
  async getTimeSummary(tenantId: string, userId: string, startDate: Date, endDate: Date) {
    const result = await this.tenantPrisma.queryRaw<any[]>(
      `SELECT
        COUNT(*) as total_entries,
        SUM(duration_minutes) as total_minutes,
        SUM(CASE WHEN is_billable = true THEN duration_minutes ELSE 0 END) as billable_minutes,
        SUM(CASE WHEN is_billable = false THEN duration_minutes ELSE 0 END) as non_billable_minutes,
        type,
        COUNT(*) FILTER (WHERE type = 'job') as job_entries,
        COUNT(*) FILTER (WHERE type = 'service_call') as service_call_entries,
        COUNT(*) FILTER (WHERE type = 'travel') as travel_entries,
        COUNT(*) FILTER (WHERE type = 'break') as break_entries
      FROM {schema}.time_entries
      WHERE user_id = $1
        AND start_time >= $2
        AND start_time <= $3
        AND end_time IS NOT NULL
      GROUP BY type`,
      [userId, startDate, endDate]
    );

    // Calculate totals across all types
    const totals = result.reduce(
      (acc, row) => {
        acc.total_minutes += parseInt(row.total_minutes || 0);
        acc.billable_minutes += parseInt(row.billable_minutes || 0);
        acc.non_billable_minutes += parseInt(row.non_billable_minutes || 0);
        acc.total_entries += parseInt(row.total_entries || 0);
        return acc;
      },
      { total_minutes: 0, billable_minutes: 0, non_billable_minutes: 0, total_entries: 0 }
    );

    return {
      ...totals,
      total_hours: (totals.total_minutes / 60).toFixed(2),
      billable_hours: (totals.billable_minutes / 60).toFixed(2),
      non_billable_hours: (totals.non_billable_minutes / 60).toFixed(2),
      by_type: result,
    };
  }

  /**
   * Get time entries for a specific job
   */
  async getJobTimeEntries(tenantId: string, jobId: string) {
    return this.findAll(tenantId, { job_id: jobId });
  }

  /**
   * Get time entries for a specific service call
   */
  async getServiceCallTimeEntries(tenantId: string, serviceCallId: string) {
    return this.findAll(tenantId, { service_call_id: serviceCallId });
  }

  /**
   * Get total billable amount for time entries
   */
  async getBillableAmount(tenantId: string, filters: any) {
    const params: any[] = [];
    let paramIndex = 1;
    let query = `
      SELECT
        SUM(duration_minutes * hourly_rate / 60) as total_amount
      FROM {schema}.time_entries
      WHERE is_billable = true
        AND end_time IS NOT NULL
        AND hourly_rate IS NOT NULL
    `;

    if (filters?.user_id) {
      query += ` AND user_id = $${paramIndex}`;
      params.push(filters.user_id);
      paramIndex++;
    }

    if (filters?.job_id) {
      query += ` AND job_id = $${paramIndex}`;
      params.push(filters.job_id);
      paramIndex++;
    }

    if (filters?.start_date) {
      query += ` AND start_time >= $${paramIndex}`;
      params.push(new Date(filters.start_date));
      paramIndex++;
    }

    if (filters?.end_date) {
      query += ` AND start_time <= $${paramIndex}`;
      params.push(new Date(filters.end_date));
      paramIndex++;
    }

    const result = await this.tenantPrisma.queryRaw<any[]>(query, params);

    return {
      total_amount: parseFloat(result[0]?.total_amount || 0),
    };
  }
}

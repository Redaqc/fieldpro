import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { CompleteChecklistDto } from './dto/complete-checklist.dto';

@Injectable()
export class ChecklistsService {
  private readonly logger = new Logger(ChecklistsService.name);

  constructor(private tenantPrisma: TenantPrismaService) {}

  /**
   * Create a new checklist template
   */
  async create(tenantId: string, createDto: CreateChecklistDto) {
    const checklist = await this.tenantPrisma.create(tenantId, 'Checklist', {
      data: {
        name: createDto.name,
        description: createDto.description,
        category: createDto.category,
        items: createDto.items,
        is_active: createDto.is_active ?? true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return checklist;
  }

  /**
   * Get all checklists with optional filters
   */
  async findAll(tenantId: string, filters?: any) {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.is_active !== undefined) {
      where.is_active = filters.is_active === 'true';
    }

    // If search filter is provided, use queryRaw for name/description search
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      const params: any[] = [searchPattern];
      let paramIndex = 2;

      let query = `SELECT * FROM {schema}.checklists WHERE (name ILIKE $1 OR description ILIKE $1)`;

      if (filters?.category) {
        query += ` AND category = $${paramIndex}`;
        params.push(filters.category);
        paramIndex++;
      }

      if (filters?.is_active !== undefined) {
        query += ` AND is_active = $${paramIndex}`;
        params.push(filters.is_active === 'true');
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC`;

      return this.tenantPrisma.queryRaw<any[]>(query, params);
    }

    return this.tenantPrisma.findMany(tenantId, 'Checklist', {
      where,
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  /**
   * Get a single checklist
   */
  async findOne(tenantId: string, id: string) {
    const checklist = await this.tenantPrisma.findOne(tenantId, 'Checklist', {
      where: { id },
    });

    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    return checklist;
  }

  /**
   * Update a checklist
   */
  async update(tenantId: string, id: string, updateDto: UpdateChecklistDto) {
    await this.findOne(tenantId, id);

    const updateData: any = { ...updateDto };
    updateData.updated_at = new Date();

    return this.tenantPrisma.update(tenantId, 'Checklist', {
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete a checklist
   */
  async delete(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    // Check if checklist has completions
    const completions = await this.getChecklistCompletions(tenantId, id);
    if (completions.length > 0) {
      throw new BadRequestException(
        'Cannot delete checklist with existing completions. Archive it instead.'
      );
    }

    return this.tenantPrisma.delete(tenantId, 'Checklist', {
      where: { id },
    });
  }

  /**
   * Archive/deactivate a checklist
   */
  async archive(tenantId: string, id: string) {
    return this.update(tenantId, id, { is_active: false });
  }

  /**
   * Duplicate a checklist
   */
  async duplicate(tenantId: string, id: string) {
    const original = await this.findOne(tenantId, id);

    return this.create(tenantId, {
      name: `${original.name} (Copy)`,
      description: original.description,
      category: original.category,
      items: original.items,
      is_active: false, // New copy starts inactive
    });
  }

  // ============================================
  // CHECKLIST COMPLETIONS
  // ============================================

  /**
   * Complete a checklist
   */
  async completeChecklist(tenantId: string, completeDto: CompleteChecklistDto) {
    // Validate that checklist exists and is active
    const checklist = await this.findOne(tenantId, completeDto.checklist_id);

    if (!checklist.is_active) {
      throw new BadRequestException('This checklist is no longer active');
    }

    // Validate required items
    const requiredItems = checklist.items.filter((item: any) => item.required);
    for (const item of requiredItems) {
      const response = completeDto.responses[item.id];
      if (!response || response.checked === undefined) {
        throw new BadRequestException(`Required item "${item.text}" is missing`);
      }
    }

    // Calculate pass/fail if not provided
    let passed = completeDto.passed;
    if (passed === undefined) {
      // Check if all required items are checked
      passed = requiredItems.every((item: any) => {
        const response = completeDto.responses[item.id];
        return response && response.checked === true;
      });
    }

    const completion = await this.tenantPrisma.create(tenantId, 'ChecklistCompletion', {
      data: {
        checklist_id: completeDto.checklist_id,
        completed_by: completeDto.completed_by,
        responses: completeDto.responses,
        job_id: completeDto.job_id,
        service_call_id: completeDto.service_call_id,
        passed,
        notes: completeDto.notes,
        completed_at: new Date(),
      },
    });

    return completion;
  }

  /**
   * Get all checklist completions
   */
  async findAllCompletions(tenantId: string, filters?: any) {
    const params: any[] = [];
    let paramIndex = 1;
    let query = `SELECT * FROM {schema}.checklist_completions WHERE 1=1`;

    if (filters?.checklist_id) {
      query += ` AND checklist_id = $${paramIndex}`;
      params.push(filters.checklist_id);
      paramIndex++;
    }

    if (filters?.completed_by) {
      query += ` AND completed_by = $${paramIndex}`;
      params.push(filters.completed_by);
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

    if (filters?.passed !== undefined) {
      query += ` AND passed = $${paramIndex}`;
      params.push(filters.passed === 'true');
      paramIndex++;
    }

    if (filters?.start_date) {
      query += ` AND completed_at >= $${paramIndex}`;
      params.push(new Date(filters.start_date));
      paramIndex++;
    }

    if (filters?.end_date) {
      query += ` AND completed_at <= $${paramIndex}`;
      params.push(new Date(filters.end_date));
      paramIndex++;
    }

    query += ` ORDER BY completed_at DESC`;

    return this.tenantPrisma.queryRaw<any[]>(query, params);
  }

  /**
   * Get a single completion
   */
  async findOneCompletion(tenantId: string, id: string) {
    const completion = await this.tenantPrisma.findOne(tenantId, 'ChecklistCompletion', {
      where: { id },
    });

    if (!completion) {
      throw new NotFoundException('Checklist completion not found');
    }

    return completion;
  }

  /**
   * Get all completions for a specific checklist
   */
  async getChecklistCompletions(tenantId: string, checklistId: string) {
    return this.findAllCompletions(tenantId, { checklist_id: checklistId });
  }

  /**
   * Get completion statistics for a checklist
   */
  async getChecklistStats(tenantId: string, checklistId: string) {
    const result = await this.tenantPrisma.queryRaw<any[]>(
      `SELECT
        COUNT(*) as total_completions,
        COUNT(*) FILTER (WHERE passed = true) as passed_count,
        COUNT(*) FILTER (WHERE passed = false) as failed_count,
        COUNT(DISTINCT completed_by) as unique_completers,
        MIN(completed_at) as first_completion,
        MAX(completed_at) as last_completion
      FROM {schema}.checklist_completions
      WHERE checklist_id = $1`,
      [checklistId]
    );

    const stats = result[0] || {
      total_completions: 0,
      passed_count: 0,
      failed_count: 0,
      unique_completers: 0,
      first_completion: null,
      last_completion: null,
    };

    return {
      ...stats,
      pass_rate: stats.total_completions > 0
        ? ((stats.passed_count / stats.total_completions) * 100).toFixed(2)
        : '0.00',
    };
  }

  /**
   * Delete a checklist completion
   */
  async deleteCompletion(tenantId: string, id: string) {
    await this.findOneCompletion(tenantId, id);

    return this.tenantPrisma.delete(tenantId, 'ChecklistCompletion', {
      where: { id },
    });
  }

  /**
   * Get checklist categories (unique list)
   */
  async getCategories(tenantId: string) {
    const result = await this.tenantPrisma.queryRaw<any[]>(
      `SELECT DISTINCT category FROM {schema}.checklists WHERE is_active = true ORDER BY category`
    );

    return result.map((row) => row.category);
  }
}

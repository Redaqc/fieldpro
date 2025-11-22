import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { CreateFormSubmissionDto } from './dto/create-form-submission.dto';

@Injectable()
export class FormsService {
  private readonly logger = new Logger(FormsService.name);

  constructor(private tenantPrisma: TenantPrismaService) {}

  /**
   * Create a new form template
   */
  async create(tenantId: string, createDto: CreateFormDto) {
    const form = await this.tenantPrisma.create(tenantId, 'Form', {
      data: {
        name: createDto.name,
        description: createDto.description,
        category: createDto.category,
        fields: createDto.fields,
        require_signature: createDto.require_signature ?? false,
        is_active: createDto.is_active ?? true,
        settings: createDto.settings || {},
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return form;
  }

  /**
   * Get all forms with optional filters
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

      let query = `SELECT * FROM {schema}.forms WHERE (name ILIKE $1 OR description ILIKE $1)`;

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

    return this.tenantPrisma.findMany(tenantId, 'Form', {
      where,
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  /**
   * Get a single form
   */
  async findOne(tenantId: string, id: string) {
    const form = await this.tenantPrisma.findOne(tenantId, 'Form', {
      where: { id },
    });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    return form;
  }

  /**
   * Update a form
   */
  async update(tenantId: string, id: string, updateDto: UpdateFormDto) {
    await this.findOne(tenantId, id);

    const updateData: any = { ...updateDto };
    updateData.updated_at = new Date();

    return this.tenantPrisma.update(tenantId, 'Form', {
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete a form
   */
  async delete(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    // Check if form has submissions
    const submissions = await this.getFormSubmissions(tenantId, id);
    if (submissions.length > 0) {
      throw new BadRequestException(
        'Cannot delete form with existing submissions. Archive it instead.'
      );
    }

    return this.tenantPrisma.delete(tenantId, 'Form', {
      where: { id },
    });
  }

  /**
   * Archive/deactivate a form
   */
  async archive(tenantId: string, id: string) {
    return this.update(tenantId, id, { is_active: false });
  }

  /**
   * Duplicate a form
   */
  async duplicate(tenantId: string, id: string) {
    const originalForm = await this.findOne(tenantId, id);

    return this.create(tenantId, {
      name: `${originalForm.name} (Copy)`,
      description: originalForm.description,
      category: originalForm.category,
      fields: originalForm.fields,
      require_signature: originalForm.require_signature,
      is_active: false, // New copy starts inactive
      settings: originalForm.settings,
    });
  }

  // ============================================
  // FORM SUBMISSIONS
  // ============================================

  /**
   * Submit a form
   */
  async submitForm(tenantId: string, createDto: CreateFormSubmissionDto) {
    // Validate that form exists and is active
    const form = await this.findOne(tenantId, createDto.form_id);

    if (!form.is_active) {
      throw new BadRequestException('This form is no longer active');
    }

    // Validate required fields
    const requiredFields = form.fields.filter((field: any) => field.required);
    for (const field of requiredFields) {
      if (!createDto.responses[field.id]) {
        throw new BadRequestException(`Required field "${field.label}" is missing`);
      }
    }

    // Validate signature if required
    if (form.require_signature && !createDto.signature) {
      throw new BadRequestException('Signature is required for this form');
    }

    const submission = await this.tenantPrisma.create(tenantId, 'FormSubmission', {
      data: {
        form_id: createDto.form_id,
        submitted_by: createDto.submitted_by,
        responses: createDto.responses,
        signature: createDto.signature,
        job_id: createDto.job_id,
        service_call_id: createDto.service_call_id,
        customer_id: createDto.customer_id,
        metadata: createDto.metadata || {},
        submitted_at: new Date(),
      },
    });

    return submission;
  }

  /**
   * Get all form submissions
   */
  async findAllSubmissions(tenantId: string, filters?: any) {
    const params: any[] = [];
    let paramIndex = 1;
    let query = `SELECT * FROM {schema}.form_submissions WHERE 1=1`;

    if (filters?.form_id) {
      query += ` AND form_id = $${paramIndex}`;
      params.push(filters.form_id);
      paramIndex++;
    }

    if (filters?.submitted_by) {
      query += ` AND submitted_by = $${paramIndex}`;
      params.push(filters.submitted_by);
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

    if (filters?.customer_id) {
      query += ` AND customer_id = $${paramIndex}`;
      params.push(filters.customer_id);
      paramIndex++;
    }

    if (filters?.start_date) {
      query += ` AND submitted_at >= $${paramIndex}`;
      params.push(new Date(filters.start_date));
      paramIndex++;
    }

    if (filters?.end_date) {
      query += ` AND submitted_at <= $${paramIndex}`;
      params.push(new Date(filters.end_date));
      paramIndex++;
    }

    query += ` ORDER BY submitted_at DESC`;

    return this.tenantPrisma.queryRaw<any[]>(query, params);
  }

  /**
   * Get a single submission
   */
  async findOneSubmission(tenantId: string, id: string) {
    const submission = await this.tenantPrisma.findOne(tenantId, 'FormSubmission', {
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Form submission not found');
    }

    return submission;
  }

  /**
   * Get all submissions for a specific form
   */
  async getFormSubmissions(tenantId: string, formId: string) {
    return this.findAllSubmissions(tenantId, { form_id: formId });
  }

  /**
   * Get submission statistics for a form
   */
  async getFormStats(tenantId: string, formId: string) {
    const result = await this.tenantPrisma.queryRaw<any[]>(
      `SELECT
        COUNT(*) as total_submissions,
        COUNT(DISTINCT submitted_by) as unique_submitters,
        COUNT(DISTINCT DATE(submitted_at)) as days_with_submissions,
        MIN(submitted_at) as first_submission,
        MAX(submitted_at) as last_submission
      FROM {schema}.form_submissions
      WHERE form_id = $1`,
      [formId]
    );

    return result[0] || {
      total_submissions: 0,
      unique_submitters: 0,
      days_with_submissions: 0,
      first_submission: null,
      last_submission: null,
    };
  }

  /**
   * Delete a form submission
   */
  async deleteSubmission(tenantId: string, id: string) {
    await this.findOneSubmission(tenantId, id);

    return this.tenantPrisma.delete(tenantId, 'FormSubmission', {
      where: { id },
    });
  }

  /**
   * Get form categories (unique list)
   */
  async getCategories(tenantId: string) {
    const result = await this.tenantPrisma.queryRaw<any[]>(
      `SELECT DISTINCT category FROM {schema}.forms WHERE is_active = true ORDER BY category`
    );

    return result.map((row) => row.category);
  }
}

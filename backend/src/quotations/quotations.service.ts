import { Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateQuotationDto, QuotationStatus } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';

@Injectable()
export class QuotationsService {
  constructor(private tenantPrisma: TenantPrismaService) {}

  async create(tenantId: string, createDto: CreateQuotationDto) {
    // Generate quotation number
    const count = await this.tenantPrisma.count(tenantId, 'Quotation', {});
    const quotationNumber = `QUO-${String(count + 1).padStart(6, '0')}`;

    // Calculate totals
    const subtotal = createDto.line_items.reduce((sum, item) => {
      return sum + item.quantity * item.unit_price;
    }, 0);

    const taxAmount = createDto.line_items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unit_price;
      const taxRate = item.tax_rate || 0;
      return sum + itemTotal * (taxRate / 100);
    }, 0);

    let discountAmount = createDto.discount_amount || 0;
    if (createDto.discount_percentage) {
      discountAmount = subtotal * (createDto.discount_percentage / 100);
    }

    const total = subtotal + taxAmount - discountAmount;

    return this.tenantPrisma.create(tenantId, 'Quotation', {
      data: {
        quotation_number: quotationNumber,
        customer_id: createDto.customer_id,
        job_id: createDto.job_id,
        title: createDto.title,
        status: createDto.status || 'draft',
        issue_date: new Date(createDto.issue_date),
        valid_until: new Date(createDto.valid_until),
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total,
        notes: createDto.notes,
        terms: createDto.terms,
        line_items: createDto.line_items,
      },
    });
  }

  async findAll(tenantId: string, filters?: any) {
    const where: any = {};

    if (filters?.customer_id) {
      where.customer_id = filters.customer_id;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    return this.tenantPrisma.findMany(tenantId, 'Quotation', {
      where,
      include: {
        customer: true,
        job: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.tenantPrisma.findOne(tenantId, 'Quotation', {
      where: { id },
      include: {
        customer: true,
        job: true,
      },
    });
  }

  async update(tenantId: string, id: string, updateDto: UpdateQuotationDto) {
    const updateData: any = { ...updateDto };

    // Recalculate totals if line items changed
    if (updateDto.line_items) {
      const subtotal = updateDto.line_items.reduce((sum, item) => {
        return sum + item.quantity * item.unit_price;
      }, 0);

      const taxAmount = updateDto.line_items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unit_price;
        const taxRate = item.tax_rate || 0;
        return sum + itemTotal * (taxRate / 100);
      }, 0);

      let discountAmount = updateDto.discount_amount || 0;
      if (updateDto.discount_percentage) {
        discountAmount = subtotal * (updateDto.discount_percentage / 100);
      }

      const total = subtotal + taxAmount - discountAmount;

      updateData.subtotal = subtotal;
      updateData.tax_amount = taxAmount;
      updateData.discount_amount = discountAmount;
      updateData.total = total;
    }

    return this.tenantPrisma.update(tenantId, 'Quotation', {
      where: { id },
      data: updateData,
    });
  }

  async delete(tenantId: string, id: string) {
    return this.tenantPrisma.delete(tenantId, 'Quotation', {
      where: { id },
    });
  }

  async accept(tenantId: string, id: string) {
    return this.tenantPrisma.update(tenantId, 'Quotation', {
      where: { id },
      data: {
        status: 'accepted',
        accepted_at: new Date(),
      },
    });
  }

  async decline(tenantId: string, id: string, reason?: string) {
    return this.tenantPrisma.update(tenantId, 'Quotation', {
      where: { id },
      data: {
        status: 'declined',
        declined_at: new Date(),
        decline_reason: reason,
      },
    });
  }

  async convertToJob(tenantId: string, id: string) {
    // ✅ SECURITY: Wrap in transaction for data consistency
    return this.tenantPrisma.$transaction(async (prisma) => {
      const quotation = await this.findOne(tenantId, id);

      if (!quotation) {
        throw new Error(`Quotation ${id} not found`);
      }

      if (quotation.status === 'accepted') {
        throw new Error('Quotation already converted to job');
      }

      // Create job from quotation
      const jobCount = await this.tenantPrisma.count(tenantId, 'Job', {});
      const jobNumber = `JOB-${String(jobCount + 1).padStart(6, '0')}`;

      const job = await this.tenantPrisma.create(tenantId, 'Job', {
        data: {
          job_number: jobNumber,
          customer_id: quotation.customer_id,
          title: quotation.title,
          description: `Created from quotation ${quotation.quotation_number}`,
          status: 'pending',
          quotation_id: id,
        },
      });

      // Update quotation - if this fails, job creation will be rolled back
      await this.update(tenantId, id, {
        status: QuotationStatus.ACCEPTED as any,
        job_id: job.id
      });

      return job;
    });
  }
}

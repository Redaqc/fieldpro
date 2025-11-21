import { Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private tenantPrisma: TenantPrismaService) {}

  async create(tenantId: string, createDto: CreateInvoiceDto) {
    // Generate invoice number
    const count = await this.tenantPrisma.count(tenantId, 'Invoice', {});
    const invoiceNumber = `INV-${String(count + 1).padStart(6, '0')}`;

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

    return this.tenantPrisma.create(tenantId, 'Invoice', {
      data: {
        invoice_number: invoiceNumber,
        customer_id: createDto.customer_id,
        job_id: createDto.job_id,
        status: createDto.status || 'draft',
        issue_date: new Date(createDto.issue_date),
        due_date: new Date(createDto.due_date),
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

    if (filters?.job_id) {
      where.job_id = filters.job_id;
    }

    return this.tenantPrisma.findMany(tenantId, 'Invoice', {
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
    return this.tenantPrisma.findOne(tenantId, 'Invoice', {
      where: { id },
      include: {
        customer: true,
        job: true,
        payments: true,
      },
    });
  }

  async update(tenantId: string, id: string, updateDto: UpdateInvoiceDto) {
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

    return this.tenantPrisma.update(tenantId, 'Invoice', {
      where: { id },
      data: updateData,
    });
  }

  async delete(tenantId: string, id: string) {
    return this.tenantPrisma.delete(tenantId, 'Invoice', {
      where: { id },
    });
  }

  async markAsPaid(tenantId: string, id: string, paymentDetails?: any) {
    // ✅ SECURITY: Wrap in transaction for data consistency
    return this.tenantPrisma.$transaction(async (prisma) => {
      // Verify invoice exists and get total amount
      const invoice = await this.findOne(tenantId, id);

      if (!invoice) {
        throw new Error(`Invoice ${id} not found`);
      }

      if (invoice.status === 'paid') {
        throw new Error('Invoice already marked as paid');
      }

      // Create payment record
      await this.tenantPrisma.create(tenantId, 'Payment', {
        data: {
          invoice_id: id,
          amount: paymentDetails?.amount || invoice.total,
          payment_date: new Date(),
          payment_method: paymentDetails?.method || 'manual',
          notes: paymentDetails?.notes,
        },
      });

      // Update invoice status - if this fails, payment creation will be rolled back
      return this.tenantPrisma.update(tenantId, 'Invoice', {
        where: { id },
        data: {
          status: 'paid',
          paid_at: new Date(),
        },
      });
    });
  }

  async send(tenantId: string, id: string) {
    return this.tenantPrisma.update(tenantId, 'Invoice', {
      where: { id },
      data: {
        status: 'sent',
        sent_at: new Date(),
      },
    });
  }
}

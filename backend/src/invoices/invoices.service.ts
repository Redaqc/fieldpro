import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(createInvoiceDto: CreateInvoiceDto) {
    const { lineItems, ...invoiceData } = createInvoiceDto;

    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: createInvoiceDto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Verify job exists if provided
    if (createInvoiceDto.jobId) {
      const job = await this.prisma.job.findUnique({
        where: { id: createInvoiceDto.jobId },
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }
    }

    // Generate invoice number if not provided
    if (!invoiceData.invoiceNumber) {
      const count = await this.prisma.invoice.count();
      const year = new Date().getFullYear();
      invoiceData.invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    // Create invoice with line items
    const invoice = await this.prisma.invoice.create({
      data: {
        ...invoiceData,
        invoiceDate: invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : new Date(),
        dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : null,
        lineItems: JSON.stringify(lineItems),
        amountPaid: 0,
        balance: createInvoiceDto.totalAmount,
      },
      include: {
        customer: true,
        job: true,
        payments: true,
      },
    });

    return {
      ...invoice,
      lineItems: JSON.parse(invoice.lineItems as string),
    };
  }

  async findAll(
    page = 1,
    limit = 20,
    status?: InvoiceStatus,
    customerId?: string,
    jobId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (jobId) {
      where.jobId = jobId;
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
          job: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices.map((invoice) => ({
        ...invoice,
        lineItems: invoice.lineItems ? JSON.parse(invoice.lineItems as string) : [],
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        job: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return {
      ...invoice,
      lineItems: invoice.lineItems ? JSON.parse(invoice.lineItems as string) : [],
    };
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto) {
    const { lineItems, ...invoiceData } = updateInvoiceDto;

    // Check if invoice exists
    await this.findOne(id);

    // Recalculate balance if totalAmount changed
    if (invoiceData.totalAmount !== undefined) {
      const currentInvoice = await this.prisma.invoice.findUnique({
        where: { id },
      });
      invoiceData.balance = invoiceData.totalAmount - (currentInvoice?.amountPaid || 0);
    }

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        ...invoiceData,
        invoiceDate: invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : undefined,
        dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : undefined,
        lineItems: lineItems ? JSON.stringify(lineItems) : undefined,
      },
      include: {
        customer: true,
        job: true,
        payments: true,
      },
    });

    return {
      ...invoice,
      lineItems: invoice.lineItems ? JSON.parse(invoice.lineItems as string) : [],
    };
  }

  async updateStatus(id: string, status: InvoiceStatus) {
    const invoice = await this.findOne(id);

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        job: true,
        payments: true,
      },
    });

    return {
      ...updatedInvoice,
      lineItems: updatedInvoice.lineItems ? JSON.parse(updatedInvoice.lineItems as string) : [],
    };
  }

  async recordPayment(id: string, amount: number, paymentMethod: string, paymentDate?: Date) {
    const invoice = await this.findOne(id);

    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    if (amount > invoice.balance) {
      throw new BadRequestException('Payment amount cannot exceed remaining balance');
    }

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: id,
        amount,
        paymentMethod: paymentMethod as any,
        paymentDate: paymentDate || new Date(),
        status: 'COMPLETED',
      },
    });

    // Update invoice amounts
    const newAmountPaid = invoice.amountPaid + amount;
    const newBalance = invoice.totalAmount - newAmountPaid;
    const newStatus = newBalance === 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

    await this.prisma.invoice.update({
      where: { id },
      data: {
        amountPaid: newAmountPaid,
        balance: newBalance,
        status: newStatus,
      },
    });

    return payment;
  }

  async getStatistics(customerId?: string) {
    const where = customerId ? { customerId } : {};

    const [
      totalInvoices,
      draftInvoices,
      sentInvoices,
      paidInvoices,
      overdueInvoices,
      totalRevenue,
      totalOutstanding,
    ] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.count({ where: { ...where, status: InvoiceStatus.DRAFT } }),
      this.prisma.invoice.count({ where: { ...where, status: InvoiceStatus.SENT } }),
      this.prisma.invoice.count({ where: { ...where, status: InvoiceStatus.PAID } }),
      this.prisma.invoice.count({
        where: {
          ...where,
          status: InvoiceStatus.OVERDUE,
        },
      }),
      this.prisma.invoice.aggregate({
        where: { ...where, status: InvoiceStatus.PAID },
        _sum: { totalAmount: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          ...where,
          status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE, InvoiceStatus.PARTIALLY_PAID] },
        },
        _sum: { balance: true },
      }),
    ]);

    return {
      totalInvoices,
      byStatus: {
        draft: draftInvoices,
        sent: sentInvoices,
        paid: paidInvoices,
        overdue: overdueInvoices,
      },
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalOutstanding: totalOutstanding._sum.balance || 0,
    };
  }

  async remove(id: string) {
    // Check if invoice exists
    await this.findOne(id);

    // Delete invoice
    await this.prisma.invoice.delete({
      where: { id },
    });

    return { message: 'Invoice deleted successfully' };
  }
}

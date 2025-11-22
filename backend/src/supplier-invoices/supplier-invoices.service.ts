import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierInvoiceDto } from './dto/create-supplier-invoice.dto';
import { UpdateSupplierInvoiceDto } from './dto/update-supplier-invoice.dto';

@Injectable()
export class SupplierInvoicesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new supplier invoice
   */
  async create(createSupplierInvoiceDto: CreateSupplierInvoiceDto) {
    // Validate dates
    const invoiceDate = new Date(createSupplierInvoiceDto.invoiceDate);
    const dueDate = new Date(createSupplierInvoiceDto.dueDate);

    if (dueDate < invoiceDate) {
      throw new BadRequestException('Due date cannot be before invoice date');
    }

    // Validate paid amount
    const paidAmount = createSupplierInvoiceDto.paidAmount || 0;
    if (paidAmount > createSupplierInvoiceDto.amount) {
      throw new BadRequestException('Paid amount cannot exceed invoice amount');
    }

    const supplierInvoice = await this.prisma.supplierInvoice.create({
      data: {
        supplierName: createSupplierInvoiceDto.supplierName,
        invoiceNumber: createSupplierInvoiceDto.invoiceNumber,
        invoiceDate,
        dueDate,
        amount: createSupplierInvoiceDto.amount,
        paidAmount,
        status: createSupplierInvoiceDto.status || 'pending',
        category: createSupplierInvoiceDto.category,
      },
    });

    return supplierInvoice;
  }

  /**
   * Get all supplier invoices with filters and pagination
   */
  async findAll(
    page: number = 1,
    limit: number = 20,
    status?: string,
    supplierName?: string,
    category?: string,
    search?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (supplierName) {
      where.supplierName = { contains: supplierName, mode: 'insensitive' };
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { supplierName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.supplierInvoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          invoiceDate: 'desc',
        },
      }),
      this.prisma.supplierInvoice.count({ where }),
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
   * Get supplier invoice by ID
   */
  async findOne(id: string) {
    const supplierInvoice = await this.prisma.supplierInvoice.findUnique({
      where: { id },
    });

    if (!supplierInvoice) {
      throw new NotFoundException('Supplier invoice not found');
    }

    return supplierInvoice;
  }

  /**
   * Update supplier invoice
   */
  async update(id: string, updateSupplierInvoiceDto: UpdateSupplierInvoiceDto) {
    // Verify invoice exists
    const existing = await this.findOne(id);

    // Validate dates if both are provided
    if (updateSupplierInvoiceDto.invoiceDate && updateSupplierInvoiceDto.dueDate) {
      const invoiceDate = new Date(updateSupplierInvoiceDto.invoiceDate);
      const dueDate = new Date(updateSupplierInvoiceDto.dueDate);

      if (dueDate < invoiceDate) {
        throw new BadRequestException('Due date cannot be before invoice date');
      }
    }

    // Validate paid amount
    const amount = updateSupplierInvoiceDto.amount || existing.amount;
    const paidAmount = updateSupplierInvoiceDto.paidAmount ?? existing.paidAmount;

    if (paidAmount > amount) {
      throw new BadRequestException('Paid amount cannot exceed invoice amount');
    }

    const supplierInvoice = await this.prisma.supplierInvoice.update({
      where: { id },
      data: {
        ...updateSupplierInvoiceDto,
        invoiceDate: updateSupplierInvoiceDto.invoiceDate
          ? new Date(updateSupplierInvoiceDto.invoiceDate)
          : undefined,
        dueDate: updateSupplierInvoiceDto.dueDate
          ? new Date(updateSupplierInvoiceDto.dueDate)
          : undefined,
      },
    });

    return supplierInvoice;
  }

  /**
   * Record payment
   */
  async recordPayment(id: string, paymentAmount: number) {
    const invoice = await this.findOne(id);

    const newPaidAmount = invoice.paidAmount + paymentAmount;

    if (newPaidAmount > invoice.amount) {
      throw new BadRequestException('Total paid amount cannot exceed invoice amount');
    }

    const status = newPaidAmount >= invoice.amount ? 'paid' : 'partial';

    return await this.prisma.supplierInvoice.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        status,
      },
    });
  }

  /**
   * Update status
   */
  async updateStatus(id: string, status: string) {
    await this.findOne(id);

    return await this.prisma.supplierInvoice.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Get supplier invoice statistics
   */
  async getStatistics(supplierName?: string, category?: string) {
    const where = supplierName
      ? { supplierName: { contains: supplierName, mode: 'insensitive' } }
      : category
        ? { category }
        : {};

    const [total, totalAmount, totalPaid, pending, paid, overdue] = await Promise.all([
      this.prisma.supplierInvoice.count({ where }),
      this.prisma.supplierInvoice.aggregate({
        where,
        _sum: { amount: true },
      }),
      this.prisma.supplierInvoice.aggregate({
        where,
        _sum: { paidAmount: true },
      }),
      this.prisma.supplierInvoice.count({
        where: { ...where, status: 'pending' },
      }),
      this.prisma.supplierInvoice.count({
        where: { ...where, status: 'paid' },
      }),
      this.prisma.supplierInvoice.count({
        where: {
          ...where,
          status: 'pending',
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return {
      totalInvoices: total,
      totalAmount: totalAmount._sum.amount || 0,
      totalPaid: totalPaid._sum.paidAmount || 0,
      outstanding: (totalAmount._sum.amount || 0) - (totalPaid._sum.paidAmount || 0),
      byStatus: {
        pending,
        paid,
        overdue,
      },
    };
  }

  /**
   * Remove supplier invoice
   */
  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.supplierInvoice.delete({
      where: { id },
    });

    return { message: 'Supplier invoice deleted successfully' };
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { QuotationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';

@Injectable()
export class QuotationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate totals for line items
   */
  private calculateTotals(lineItems: any[]) {
    let subtotal = 0;
    let tax = 0;

    const processedItems = lineItems.map((item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemTax = item.taxRate ? (itemSubtotal * item.taxRate) / 100 : 0;
      const itemTotal = itemSubtotal + itemTax;

      subtotal += itemSubtotal;
      tax += itemTax;

      return {
        ...item,
        total: itemTotal,
      };
    });

    return {
      lineItems: processedItems,
      subtotal,
      tax,
      total: subtotal + tax,
    };
  }

  /**
   * Create a new quotation
   */
  async create(createQuotationDto: CreateQuotationDto) {
    // Generate quote number if not provided
    if (!createQuotationDto.quoteNumber) {
      const count = await this.prisma.quotation.count();
      const year = new Date().getFullYear();
      createQuotationDto.quoteNumber = `QUO-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    // Check if quote number already exists
    const existingQuote = await this.prisma.quotation.findUnique({
      where: { quoteNumber: createQuotationDto.quoteNumber },
    });

    if (existingQuote) {
      throw new ConflictException('Quote number already exists');
    }

    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: createQuotationDto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Validate dates
    const issueDate = new Date(createQuotationDto.issueDate);
    const expiryDate = new Date(createQuotationDto.expiryDate);

    if (expiryDate <= issueDate) {
      throw new BadRequestException('Expiry date must be after issue date');
    }

    // Calculate totals
    const { lineItems, subtotal, tax, total } = this.calculateTotals(
      createQuotationDto.lineItems,
    );

    // Create quotation
    const quotation = await this.prisma.quotation.create({
      data: {
        quoteNumber: createQuotationDto.quoteNumber,
        customerId: createQuotationDto.customerId,
        title: createQuotationDto.title,
        description: createQuotationDto.description,
        issueDate,
        expiryDate,
        lineItems,
        subtotal,
        tax,
        total,
        notes: createQuotationDto.notes,
      },
      include: {
        customer: true,
      },
    });

    return quotation;
  }

  /**
   * Get all quotations with filters and pagination
   */
  async findAll(
    page: number = 1,
    limit: number = 20,
    status?: QuotationStatus,
    customerId?: string,
    search?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.OR = [
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.quotation.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.quotation.count({ where }),
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
   * Get quotation by ID
   */
  async findOne(id: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }

    return quotation;
  }

  /**
   * Update quotation
   */
  async update(id: string, updateQuotationDto: UpdateQuotationDto) {
    // Verify quotation exists
    await this.findOne(id);

    // If updating quote number, check uniqueness
    if (updateQuotationDto.quoteNumber) {
      const existingQuote = await this.prisma.quotation.findUnique({
        where: { quoteNumber: updateQuotationDto.quoteNumber },
      });

      if (existingQuote && existingQuote.id !== id) {
        throw new ConflictException('Quote number already exists');
      }
    }

    // If updating customer, verify customer exists
    if (updateQuotationDto.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: updateQuotationDto.customerId },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
    }

    // Validate dates if both are provided
    if (updateQuotationDto.issueDate && updateQuotationDto.expiryDate) {
      const issueDate = new Date(updateQuotationDto.issueDate);
      const expiryDate = new Date(updateQuotationDto.expiryDate);

      if (expiryDate <= issueDate) {
        throw new BadRequestException('Expiry date must be after issue date');
      }
    }

    // Recalculate totals if line items are updated
    let calculatedData: any = {};
    if (updateQuotationDto.lineItems) {
      const { lineItems, subtotal, tax, total } = this.calculateTotals(
        updateQuotationDto.lineItems,
      );
      calculatedData = { lineItems, subtotal, tax, total };
    }

    // Update quotation
    const quotation = await this.prisma.quotation.update({
      where: { id },
      data: {
        ...updateQuotationDto,
        ...calculatedData,
        issueDate: updateQuotationDto.issueDate
          ? new Date(updateQuotationDto.issueDate)
          : undefined,
        expiryDate: updateQuotationDto.expiryDate
          ? new Date(updateQuotationDto.expiryDate)
          : undefined,
      },
      include: {
        customer: true,
      },
    });

    return quotation;
  }

  /**
   * Update quotation status
   */
  async updateStatus(id: string, status: QuotationStatus) {
    await this.findOne(id);

    const quotation = await this.prisma.quotation.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
      },
    });

    return quotation;
  }

  /**
   * Check and mark expired quotations
   */
  async markExpiredQuotations() {
    const now = new Date();

    const result = await this.prisma.quotation.updateMany({
      where: {
        expiryDate: {
          lt: now,
        },
        status: {
          in: [QuotationStatus.DRAFT, QuotationStatus.SENT],
        },
      },
      data: {
        status: QuotationStatus.EXPIRED,
      },
    });

    return result;
  }

  /**
   * Get quotation statistics
   */
  async getStatistics(customerId?: string) {
    const where = customerId ? { customerId } : {};

    const [
      total,
      draft,
      sent,
      accepted,
      rejected,
      expired,
      totalValue,
      acceptedValue,
    ] = await Promise.all([
      this.prisma.quotation.count({ where }),
      this.prisma.quotation.count({
        where: { ...where, status: QuotationStatus.DRAFT },
      }),
      this.prisma.quotation.count({
        where: { ...where, status: QuotationStatus.SENT },
      }),
      this.prisma.quotation.count({
        where: { ...where, status: QuotationStatus.ACCEPTED },
      }),
      this.prisma.quotation.count({
        where: { ...where, status: QuotationStatus.REJECTED },
      }),
      this.prisma.quotation.count({
        where: { ...where, status: QuotationStatus.EXPIRED },
      }),
      this.prisma.quotation.aggregate({
        where,
        _sum: { total: true },
      }),
      this.prisma.quotation.aggregate({
        where: { ...where, status: QuotationStatus.ACCEPTED },
        _sum: { total: true },
      }),
    ]);

    return {
      totalQuotations: total,
      byStatus: {
        draft,
        sent,
        accepted,
        rejected,
        expired,
      },
      totalValue: totalValue._sum.total || 0,
      acceptedValue: acceptedValue._sum.total || 0,
      conversionRate: sent > 0 ? (accepted / sent) * 100 : 0,
    };
  }

  /**
   * Remove quotation
   */
  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.quotation.delete({
      where: { id },
    });

    return { message: 'Quotation deleted successfully' };
  }
}

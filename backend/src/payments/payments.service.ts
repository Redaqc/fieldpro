import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(createPaymentDto: CreatePaymentDto) {
    // Verify invoice exists
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: createPaymentDto.invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Validate payment amount
    if (createPaymentDto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    if (createPaymentDto.amount > invoice.balance) {
      throw new BadRequestException('Payment amount cannot exceed remaining balance');
    }

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        ...createPaymentDto,
        paymentDate: createPaymentDto.paymentDate
          ? new Date(createPaymentDto.paymentDate)
          : new Date(),
        status: 'COMPLETED',
      },
      include: {
        invoice: {
          include: {
            customer: true,
          },
        },
      },
    });

    // Update invoice amounts
    const newAmountPaid = invoice.amountPaid + createPaymentDto.amount;
    const newBalance = invoice.totalAmount - newAmountPaid;
    const newStatus = newBalance === 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

    await this.prisma.invoice.update({
      where: { id: createPaymentDto.invoiceId },
      data: {
        amountPaid: newAmountPaid,
        balance: newBalance,
        status: newStatus,
      },
    });

    return payment;
  }

  async findAll(page = 1, limit = 20, invoiceId?: string, customerId?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    if (customerId) {
      where.invoice = {
        customerId,
      };
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          invoice: {
            include: {
              customer: true,
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            customer: true,
            job: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    // Check if payment exists
    await this.findOne(id);

    const payment = await this.prisma.payment.update({
      where: { id },
      data: {
        ...updatePaymentDto,
        paymentDate: updatePaymentDto.paymentDate
          ? new Date(updatePaymentDto.paymentDate)
          : undefined,
      },
      include: {
        invoice: {
          include: {
            customer: true,
          },
        },
      },
    });

    return payment;
  }

  async getStatistics(customerId?: string) {
    const where = customerId
      ? {
          invoice: {
            customerId,
          },
        }
      : {};

    const [totalPayments, totalAmount, paymentsByMethod] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.aggregate({
        where,
        _sum: { amount: true },
      }),
      this.prisma.payment.groupBy({
        by: ['paymentMethod'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      totalPayments,
      totalAmount: totalAmount._sum.amount || 0,
      byPaymentMethod: paymentsByMethod.map((pm) => ({
        method: pm.paymentMethod,
        count: pm._count,
        total: pm._sum.amount || 0,
      })),
    };
  }

  async remove(id: string) {
    // Get payment details
    const payment = await this.findOne(id);

    // Reverse the payment on the invoice
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: payment.invoiceId },
    });

    if (invoice) {
      const newAmountPaid = invoice.amountPaid - payment.amount;
      const newBalance = invoice.totalAmount - newAmountPaid;
      const newStatus =
        newBalance === invoice.totalAmount
          ? InvoiceStatus.SENT
          : newBalance > 0
          ? InvoiceStatus.PARTIALLY_PAID
          : InvoiceStatus.PAID;

      await this.prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: newStatus,
        },
      });
    }

    // Delete payment
    await this.prisma.payment.delete({
      where: { id },
    });

    return { message: 'Payment deleted successfully' };
  }
}

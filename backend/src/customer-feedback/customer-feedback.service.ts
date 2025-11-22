import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerFeedbackDto } from './dto/create-customer-feedback.dto';
import { UpdateCustomerFeedbackDto } from './dto/update-customer-feedback.dto';

@Injectable()
export class CustomerFeedbackService {
  constructor(private prisma: PrismaService) {}
  async create(dto: CreateCustomerFeedbackDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException('Customer not found');
    return await this.prisma.customerFeedback.create({ data: dto, include: { customer: true } });
  }
  async findAll(page = 1, limit = 20, customerId?: string, jobId?: string, minRating?: number) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (jobId) where.jobId = jobId;
    if (minRating) where.rating = { gte: minRating };
    const [data, total] = await Promise.all([
      this.prisma.customerFeedback.findMany({ where, skip, take: limit, include: { customer: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.customerFeedback.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
  async findOne(id: string) {
    const feedback = await this.prisma.customerFeedback.findUnique({ where: { id }, include: { customer: true } });
    if (!feedback) throw new NotFoundException('Feedback not found');
    return feedback;
  }
  async update(id: string, dto: UpdateCustomerFeedbackDto) {
    await this.findOne(id);
    return await this.prisma.customerFeedback.update({ where: { id }, data: dto, include: { customer: true } });
  }
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.customerFeedback.delete({ where: { id } });
    return { message: 'Feedback deleted successfully' };
  }
}

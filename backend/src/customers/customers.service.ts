import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    // Check if customer with email already exists
    const existing = await this.prisma.customer.findUnique({
      where: { email: createCustomerDto.email },
    });

    if (existing) {
      throw new ConflictException('Customer with this email already exists');
    }

    const customer = await this.prisma.customer.create({
      data: createCustomerDto,
    });

    return customer;
  }

  async findAll(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { companyName: { contains: search, mode: 'insensitive' as const } },
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        jobs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    // Check if customer exists
    await this.findOne(id);

    // If email is being updated, check it's not taken
    if (updateCustomerDto.email) {
      const existing = await this.prisma.customer.findUnique({
        where: { email: updateCustomerDto.email },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Email already in use');
      }
    }

    const customer = await this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
    });

    return customer;
  }

  async remove(id: string) {
    // Check if customer exists
    await this.findOne(id);

    // Soft delete by setting isActive to false
    await this.prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Customer deactivated successfully' };
  }

  async hardDelete(id: string) {
    // Check if customer exists
    await this.findOne(id);

    // Hard delete
    await this.prisma.customer.delete({
      where: { id },
    });

    return { message: 'Customer permanently deleted' };
  }
}

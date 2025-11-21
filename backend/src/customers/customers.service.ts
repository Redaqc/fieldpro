import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private tenantPrisma: TenantPrismaService) {}

  async findAll(tenantId: string, filters?: any) {
    const where: any = {};

    if (filters?.is_active !== undefined) {
      where.is_active = filters.is_active === 'true';
    }

    return this.tenantPrisma.findMany(tenantId, 'Customer', {
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const customer = await this.tenantPrisma.findOne(tenantId, 'Customer', {
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async create(tenantId: string, createCustomerDto: CreateCustomerDto) {
    // ✅ RACE CONDITION FIX: Use database sequence instead of count+1
    const result = await this.tenantPrisma.queryRaw<Array<{ nextval: number }>>(
      `SELECT nextval('{schema}.customer_number_seq') as nextval`
    );
    const customerNumber = `CUST-${String(result[0].nextval).padStart(6, '0')}`;

    return this.tenantPrisma.create(tenantId, 'Customer', {
      data: {
        customer_number: customerNumber,
        ...createCustomerDto,
        is_active: createCustomerDto.is_active !== false,
      },
    });
  }

  async update(tenantId: string, id: string, updateCustomerDto: UpdateCustomerDto) {
    await this.findOne(tenantId, id);

    return this.tenantPrisma.update(tenantId, 'Customer', {
      where: { id },
      data: updateCustomerDto,
    });
  }

  async delete(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.tenantPrisma.delete(tenantId, 'Customer', {
      where: { id },
    });
  }
}

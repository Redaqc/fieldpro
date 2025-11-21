import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private tenantPrisma: TenantPrismaService) {}

  async findAll() {
    return this.tenantPrisma.queryRaw(`
      SELECT * FROM {schema}.customers
      WHERE is_sample = false
      ORDER BY created_date DESC
    `);
  }

  async findOne(id: string) {
    const customer = await this.tenantPrisma.findOne('customers', id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async create(createCustomerDto: CreateCustomerDto, userId: string, userEmail: string) {
    const data = {
      ...createCustomerDto,
      id: this.generateUUID(),
      tags: JSON.stringify(createCustomerDto.tags || []),
      status: createCustomerDto.status || 'active',
      created_date: new Date(),
      updated_date: new Date(),
      created_by_id: userId,
      created_by: userEmail,
      is_sample: false,
    };

    return this.tenantPrisma.create('customers', data);
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    await this.findOne(id);
    
    const data: any = {};
    Object.keys(updateCustomerDto).forEach(key => {
      if (updateCustomerDto[key] !== undefined) {
        if (key === 'tags') {
          data[key] = JSON.stringify(updateCustomerDto[key]);
        } else {
          data[key] = updateCustomerDto[key];
        }
      }
    });

    return this.tenantPrisma.update('customers', id, data);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.tenantPrisma.delete('customers', id);
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

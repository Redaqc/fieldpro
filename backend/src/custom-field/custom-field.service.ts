import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';

@Injectable()
export class CustomFieldService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCustomFieldDto) {
    return await this.prisma.customField.create({ data: dto });
  }

  async findAll(page = 1, limit = 20, entityType?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (entityType) where.entityType = entityType;

    const [data, total] = await Promise.all([
      this.prisma.customField.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.customField.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const field = await this.prisma.customField.findUnique({ where: { id } });
    if (!field) throw new NotFoundException('Custom field not found');
    return field;
  }

  async findByEntityType(entityType: string) {
    return await this.prisma.customField.findMany({
      where: { entityType },
      orderBy: { fieldName: 'asc' },
    });
  }

  async update(id: string, dto: UpdateCustomFieldDto) {
    await this.findOne(id);
    return await this.prisma.customField.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.customField.delete({ where: { id } });
    return { message: 'Custom field deleted successfully' };
  }
}

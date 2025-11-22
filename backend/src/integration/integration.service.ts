import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { IntegrationType } from '@prisma/client';

@Injectable()
export class IntegrationService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateIntegrationDto) {
    const data: any = { ...dto };
    if (dto.lastSync) data.lastSync = new Date(dto.lastSync);
    return await this.prisma.integration.create({ data });
  }

  async findAll(page = 1, limit = 20, type?: IntegrationType, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.integration.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.integration.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const integration = await this.prisma.integration.findUnique({ where: { id } });
    if (!integration) throw new NotFoundException('Integration not found');
    return integration;
  }

  async findByType(type: IntegrationType) {
    return await this.prisma.integration.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateIntegrationDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.lastSync) data.lastSync = new Date(dto.lastSync);
    return await this.prisma.integration.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.integration.delete({ where: { id } });
    return { message: 'Integration deleted successfully' };
  }
}

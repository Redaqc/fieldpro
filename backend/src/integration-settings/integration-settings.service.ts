import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIntegrationSettingsDto } from './dto/create-integration-settings.dto';
import { UpdateIntegrationSettingsDto } from './dto/update-integration-settings.dto';

@Injectable()
export class IntegrationSettingsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateIntegrationSettingsDto) {
    const data: any = { ...dto };
    if (dto.lastSyncDate) data.lastSyncDate = new Date(dto.lastSyncDate);
    return await this.prisma.integrationSettings.create({ data });
  }

  async findAll(page = 1, limit = 20, integrationType?: string, enabled?: boolean) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (integrationType) where.integrationType = integrationType;
    if (enabled !== undefined) where.enabled = enabled;

    const [data, total] = await Promise.all([
      this.prisma.integrationSettings.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.integrationSettings.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const settings = await this.prisma.integrationSettings.findUnique({ where: { id } });
    if (!settings) throw new NotFoundException('Integration settings not found');
    return settings;
  }

  async findByType(integrationType: string) {
    return await this.prisma.integrationSettings.findMany({
      where: { integrationType },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateIntegrationSettingsDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.lastSyncDate) data.lastSyncDate = new Date(dto.lastSyncDate);
    return await this.prisma.integrationSettings.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.integrationSettings.delete({ where: { id } });
    return { message: 'Integration settings deleted successfully' };
  }
}

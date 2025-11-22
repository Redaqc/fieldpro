import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaxSettingsDto } from './dto/create-tax-settings.dto';
import { UpdateTaxSettingsDto } from './dto/update-tax-settings.dto';

@Injectable()
export class TaxSettingsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTaxSettingsDto) {
    return await this.prisma.taxSettings.create({ data: dto });
  }

  async findAll(page = 1, limit = 20, active?: boolean, province?: string, country?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (active !== undefined) where.active = active;
    if (province) where.province = province;
    if (country) where.country = country;

    const [data, total] = await Promise.all([
      this.prisma.taxSettings.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.taxSettings.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const settings = await this.prisma.taxSettings.findUnique({ where: { id } });
    if (!settings) throw new NotFoundException('Tax settings not found');
    return settings;
  }

  async findActive() {
    return await this.prisma.taxSettings.findMany({
      where: { active: true },
      orderBy: { taxName: 'asc' },
    });
  }

  async update(id: string, dto: UpdateTaxSettingsDto) {
    await this.findOne(id);
    return await this.prisma.taxSettings.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.taxSettings.delete({ where: { id } });
    return { message: 'Tax settings deleted successfully' };
  }
}

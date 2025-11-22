import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandingSettingsDto } from './dto/create-branding-settings.dto';
import { UpdateBrandingSettingsDto } from './dto/update-branding-settings.dto';

@Injectable()
export class BrandingSettingsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBrandingSettingsDto) {
    return await this.prisma.brandingSettings.create({ data: dto });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.brandingSettings.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.brandingSettings.count(),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const settings = await this.prisma.brandingSettings.findUnique({ where: { id } });
    if (!settings) throw new NotFoundException('Branding settings not found');
    return settings;
  }

  async getCurrent() {
    const settings = await this.prisma.brandingSettings.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!settings) throw new NotFoundException('No branding settings configured');
    return settings;
  }

  async update(id: string, dto: UpdateBrandingSettingsDto) {
    await this.findOne(id);
    return await this.prisma.brandingSettings.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.brandingSettings.delete({ where: { id } });
    return { message: 'Branding settings deleted successfully' };
  }
}

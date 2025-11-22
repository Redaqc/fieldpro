import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppSettingsDto } from './dto/create-app-settings.dto';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';

@Injectable()
export class AppSettingsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAppSettingsDto) {
    return await this.prisma.appSettings.create({ data: dto });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.appSettings.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.appSettings.count(),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const settings = await this.prisma.appSettings.findUnique({ where: { id } });
    if (!settings) throw new NotFoundException('App settings not found');
    return settings;
  }

  async getCurrent() {
    const settings = await this.prisma.appSettings.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!settings) throw new NotFoundException('No app settings configured');
    return settings;
  }

  async update(id: string, dto: UpdateAppSettingsDto) {
    await this.findOne(id);
    return await this.prisma.appSettings.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.appSettings.delete({ where: { id } });
    return { message: 'App settings deleted successfully' };
  }
}

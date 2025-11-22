import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';

@Injectable()
export class NotificationTemplatesService {
  constructor(private prisma: PrismaService) {}
  async create(dto: CreateNotificationTemplateDto) { return await this.prisma.notificationTemplate.create({ data: dto }); }
  async findAll(page = 1, limit = 20, type?: string, active?: boolean) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (type) where.type = type;
    if (active !== undefined) where.active = active;
    const [data, total] = await Promise.all([
      this.prisma.notificationTemplate.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.notificationTemplate.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
  async findOne(id: string) {
    const template = await this.prisma.notificationTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Notification template not found');
    return template;
  }
  async update(id: string, dto: UpdateNotificationTemplateDto) {
    await this.findOne(id);
    return await this.prisma.notificationTemplate.update({ where: { id }, data: dto });
  }
  async toggleActive(id: string) {
    const template = await this.findOne(id);
    return await this.prisma.notificationTemplate.update({ where: { id }, data: { active: !template.active } });
  }
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.notificationTemplate.delete({ where: { id } });
    return { message: 'Notification template deleted successfully' };
  }
}

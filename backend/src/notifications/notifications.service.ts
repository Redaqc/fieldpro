import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}
  async create(dto: CreateNotificationDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');
    return await this.prisma.notification.create({ data: dto, include: { user: { select: { id: true, firstName: true, lastName: true } } } });
  }
  async findAll(page = 1, limit = 20, userId?: string, read?: boolean, type?: NotificationType) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (userId) where.userId = userId;
    if (read !== undefined) where.read = read;
    if (type) where.type = type;
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({ where, skip, take: limit, include: { user: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.notification.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
  async findOne(id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id }, include: { user: true } });
    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }
  async update(id: string, dto: UpdateNotificationDto) {
    await this.findOne(id);
    return await this.prisma.notification.update({ where: { id }, data: dto, include: { user: true } });
  }
  async markAsRead(id: string) {
    await this.findOne(id);
    return await this.prisma.notification.update({ where: { id }, data: { read: true } });
  }
  async markAllAsRead(userId: string) {
    return await this.prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  }
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.notification.delete({ where: { id } });
    return { message: 'Notification deleted successfully' };
  }
}

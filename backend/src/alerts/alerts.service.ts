import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}
  async create(dto: CreateAlertDto) { return await this.prisma.alert.create({ data: dto }); }
  async findAll(page = 1, limit = 20, userId?: string, read?: boolean, type?: NotificationType) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (userId) where.userId = userId;
    if (read !== undefined) where.read = read;
    if (type) where.type = type;
    const [data, total] = await Promise.all([
      this.prisma.alert.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.alert.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
  async findOne(id: string) {
    const alert = await this.prisma.alert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Alert not found');
    return alert;
  }
  async update(id: string, dto: UpdateAlertDto) {
    await this.findOne(id);
    return await this.prisma.alert.update({ where: { id }, data: dto });
  }
  async markAsRead(id: string) {
    await this.findOne(id);
    return await this.prisma.alert.update({ where: { id }, data: { read: true } });
  }
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.alert.delete({ where: { id } });
    return { message: 'Alert deleted successfully' };
  }
}

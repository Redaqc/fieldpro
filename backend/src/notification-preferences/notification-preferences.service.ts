import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationPreferenceDto } from './dto/create-notification-preference.dto';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';

@Injectable()
export class NotificationPreferencesService {
  constructor(private prisma: PrismaService) {}
  async create(dto: CreateNotificationPreferenceDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');
    const existing = await this.prisma.notificationPreference.findUnique({ where: { userId: dto.userId } });
    if (existing) throw new ConflictException('Notification preferences already exist for this user');
    return await this.prisma.notificationPreference.create({ data: dto, include: { user: true } });
  }
  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.notificationPreference.findMany({ skip, take: limit, include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.notificationPreference.count(),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
  async findOne(id: string) {
    const pref = await this.prisma.notificationPreference.findUnique({ where: { id }, include: { user: true } });
    if (!pref) throw new NotFoundException('Notification preferences not found');
    return pref;
  }
  async findByUser(userId: string) {
    return await this.prisma.notificationPreference.findUnique({ where: { userId }, include: { user: true } });
  }
  async update(id: string, dto: UpdateNotificationPreferenceDto) {
    await this.findOne(id);
    return await this.prisma.notificationPreference.update({ where: { id }, data: dto, include: { user: true } });
  }
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.notificationPreference.delete({ where: { id } });
    return { message: 'Notification preferences deleted successfully' };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePushSubscriptionDto } from './dto/create-push-subscription.dto';
import { UpdatePushSubscriptionDto } from './dto/update-push-subscription.dto';

@Injectable()
export class PushSubscriptionsService {
  constructor(private prisma: PrismaService) {}
  async create(dto: CreatePushSubscriptionDto) {
    return await this.prisma.pushSubscription.create({ data: dto });
  }
  async findAll(page = 1, limit = 20, userEmail?: string, active?: boolean) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (userEmail) where.userEmail = userEmail;
    if (active !== undefined) where.active = active;
    const [data, total] = await Promise.all([
      this.prisma.pushSubscription.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.pushSubscription.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
  async findOne(id: string) {
    const sub = await this.prisma.pushSubscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Push subscription not found');
    return sub;
  }
  async update(id: string, dto: UpdatePushSubscriptionDto) {
    await this.findOne(id);
    return await this.prisma.pushSubscription.update({ where: { id }, data: dto });
  }
  async toggleActive(id: string) {
    const sub = await this.findOne(id);
    return await this.prisma.pushSubscription.update({ where: { id }, data: { active: !sub.active } });
  }
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.pushSubscription.delete({ where: { id } });
    return { message: 'Push subscription deleted successfully' };
  }
}

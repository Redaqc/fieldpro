import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

@Injectable()
export class WebhookService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateWebhookDto) {
    return await this.prisma.webhook.create({ data: dto });
  }

  async findAll(page = 1, limit = 20, eventType?: string, active?: boolean) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (eventType) where.eventType = eventType;
    if (active !== undefined) where.active = active;

    const [data, total] = await Promise.all([
      this.prisma.webhook.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.webhook.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const webhook = await this.prisma.webhook.findUnique({ where: { id } });
    if (!webhook) throw new NotFoundException('Webhook not found');
    return webhook;
  }

  async findActive() {
    return await this.prisma.webhook.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async findByEventType(eventType: string) {
    return await this.prisma.webhook.findMany({
      where: { eventType, active: true },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, dto: UpdateWebhookDto) {
    await this.findOne(id);
    return await this.prisma.webhook.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.webhook.delete({ where: { id } });
    return { message: 'Webhook deleted successfully' };
  }
}

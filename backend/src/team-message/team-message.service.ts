import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamMessageDto } from './dto/create-team-message.dto';
import { UpdateTeamMessageDto } from './dto/update-team-message.dto';

@Injectable()
export class TeamMessageService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTeamMessageDto) {
    const sender = await this.prisma.user.findUnique({ where: { email: dto.senderEmail } });
    if (!sender) throw new NotFoundException('Sender not found');

    const recipient = await this.prisma.user.findUnique({ where: { email: dto.recipientEmail } });
    if (!recipient) throw new NotFoundException('Recipient not found');

    return await this.prisma.teamMessage.create({
      data: dto,
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, email: true } },
        recipient: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async findAll(page = 1, limit = 20, senderEmail?: string, recipientEmail?: string, channel?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (senderEmail) where.senderEmail = senderEmail;
    if (recipientEmail) where.recipientEmail = recipientEmail;
    if (channel) where.channel = channel;

    const [data, total] = await Promise.all([
      this.prisma.teamMessage.findMany({
        where,
        skip,
        take: limit,
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, email: true } },
          recipient: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.teamMessage.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const message = await this.prisma.teamMessage.findUnique({
      where: { id },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, email: true } },
        recipient: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    if (!message) throw new NotFoundException('Team message not found');
    return message;
  }

  async findConversation(email1: string, email2: string) {
    return await this.prisma.teamMessage.findMany({
      where: {
        OR: [
          { senderEmail: email1, recipientEmail: email2 },
          { senderEmail: email2, recipientEmail: email1 },
        ],
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, email: true } },
        recipient: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markAsRead(id: string) {
    await this.findOne(id);
    return await this.prisma.teamMessage.update({
      where: { id },
      data: { read: true },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, email: true } },
        recipient: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async update(id: string, dto: UpdateTeamMessageDto) {
    await this.findOne(id);
    return await this.prisma.teamMessage.update({
      where: { id },
      data: dto,
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, email: true } },
        recipient: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.teamMessage.delete({ where: { id } });
    return { message: 'Team message deleted successfully' };
  }
}

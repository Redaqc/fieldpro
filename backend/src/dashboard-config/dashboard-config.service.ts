import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDashboardConfigDto } from './dto/create-dashboard-config.dto';
import { UpdateDashboardConfigDto } from './dto/update-dashboard-config.dto';

@Injectable()
export class DashboardConfigService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDashboardConfigDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    return await this.prisma.dashboardConfig.create({
      data: dto,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  async findAll(page = 1, limit = 20, userId?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (userId) where.userId = userId;

    const [data, total] = await Promise.all([
      this.prisma.dashboardConfig.findMany({
        where,
        skip,
        take: limit,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.dashboardConfig.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const config = await this.prisma.dashboardConfig.findUnique({
      where: { id },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    if (!config) throw new NotFoundException('Dashboard config not found');
    return config;
  }

  async findByUserId(userId: string) {
    const config = await this.prisma.dashboardConfig.findFirst({
      where: { userId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    if (!config) throw new NotFoundException('Dashboard config not found for this user');
    return config;
  }

  async update(id: string, dto: UpdateDashboardConfigDto) {
    await this.findOne(id);
    return await this.prisma.dashboardConfig.update({
      where: { id },
      data: dto,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.dashboardConfig.delete({ where: { id } });
    return { message: 'Dashboard config deleted successfully' };
  }
}

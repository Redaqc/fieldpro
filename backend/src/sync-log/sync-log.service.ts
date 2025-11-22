import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSyncLogDto } from './dto/create-sync-log.dto';
import { UpdateSyncLogDto } from './dto/update-sync-log.dto';
import { SyncStatus } from '@prisma/client';

@Injectable()
export class SyncLogService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSyncLogDto) {
    const data: any = { ...dto };
    data.startedAt = new Date(dto.startedAt);
    if (dto.completedAt) data.completedAt = new Date(dto.completedAt);
    return await this.prisma.syncLog.create({ data });
  }

  async findAll(page = 1, limit = 20, integrationType?: string, status?: SyncStatus) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (integrationType) where.integrationType = integrationType;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.syncLog.findMany({ where, skip, take: limit, orderBy: { startedAt: 'desc' } }),
      this.prisma.syncLog.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const log = await this.prisma.syncLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Sync log not found');
    return log;
  }

  async findByIntegrationType(integrationType: string) {
    return await this.prisma.syncLog.findMany({
      where: { integrationType },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
  }

  async getStatistics(integrationType?: string) {
    const where: any = {};
    if (integrationType) where.integrationType = integrationType;

    const [total, completed, failed, inProgress] = await Promise.all([
      this.prisma.syncLog.count({ where }),
      this.prisma.syncLog.count({ where: { ...where, status: SyncStatus.COMPLETED } }),
      this.prisma.syncLog.count({ where: { ...where, status: SyncStatus.FAILED } }),
      this.prisma.syncLog.count({ where: { ...where, status: SyncStatus.IN_PROGRESS } }),
    ]);

    return { total, completed, failed, inProgress };
  }

  async update(id: string, dto: UpdateSyncLogDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.startedAt) data.startedAt = new Date(dto.startedAt);
    if (dto.completedAt) data.completedAt = new Date(dto.completedAt);
    return await this.prisma.syncLog.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.syncLog.delete({ where: { id } });
    return { message: 'Sync log deleted successfully' };
  }
}

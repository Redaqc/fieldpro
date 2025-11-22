import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfitabilityRecordDto } from './dto/create-profitability-record.dto';
import { UpdateProfitabilityRecordDto } from './dto/update-profitability-record.dto';

@Injectable()
export class ProfitabilityRecordsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateProfitabilityRecordDto) {
    const job = await this.prisma.job.findUnique({ where: { id: createDto.jobId } });
    if (!job) throw new NotFoundException('Job not found');

    const existing = await this.prisma.profitabilityRecord.findUnique({ where: { jobId: createDto.jobId } });
    if (existing) throw new ConflictException('Profitability record already exists for this job');

    return await this.prisma.profitabilityRecord.create({
      data: createDto,
      include: { job: true },
    });
  }

  async findAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.profitabilityRecord.findMany({ skip, take: limit, include: { job: true }, orderBy: { calculatedAt: 'desc' } }),
      this.prisma.profitabilityRecord.count(),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const record = await this.prisma.profitabilityRecord.findUnique({ where: { id }, include: { job: true } });
    if (!record) throw new NotFoundException('Profitability record not found');
    return record;
  }

  async findByJob(jobId: string) {
    return await this.prisma.profitabilityRecord.findUnique({ where: { jobId }, include: { job: true } });
  }

  async update(id: string, updateDto: UpdateProfitabilityRecordDto) {
    await this.findOne(id);
    return await this.prisma.profitabilityRecord.update({ where: { id }, data: updateDto, include: { job: true } });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.profitabilityRecord.delete({ where: { id } });
    return { message: 'Profitability record deleted successfully' };
  }
}

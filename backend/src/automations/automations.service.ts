import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';

@Injectable()
export class AutomationsService {
  constructor(private prisma: PrismaService) {}
  async create(dto: CreateAutomationDto) { return await this.prisma.automation.create({ data: dto }); }
  async findAll(page = 1, limit = 20, active?: boolean) {
    const skip = (page - 1) * limit;
    const where: any = active !== undefined ? { active } : {};
    const [data, total] = await Promise.all([
      this.prisma.automation.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.automation.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
  async findOne(id: string) {
    const automation = await this.prisma.automation.findUnique({ where: { id } });
    if (!automation) throw new NotFoundException('Automation not found');
    return automation;
  }
  async update(id: string, dto: UpdateAutomationDto) {
    await this.findOne(id);
    return await this.prisma.automation.update({ where: { id }, data: dto });
  }
  async toggleActive(id: string) {
    const automation = await this.findOne(id);
    return await this.prisma.automation.update({ where: { id }, data: { active: !automation.active } });
  }
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.automation.delete({ where: { id } });
    return { message: 'Automation deleted successfully' };
  }
}

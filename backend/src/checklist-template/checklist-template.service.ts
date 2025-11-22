import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import { UpdateChecklistTemplateDto } from './dto/update-checklist-template.dto';

@Injectable()
export class ChecklistTemplateService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateChecklistTemplateDto) {
    return await this.prisma.checklistTemplate.create({ data: dto });
  }

  async findAll(page = 1, limit = 20, category?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (category) where.category = category;

    const [data, total] = await Promise.all([
      this.prisma.checklistTemplate.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.checklistTemplate.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const template = await this.prisma.checklistTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Checklist template not found');
    return template;
  }

  async findByCategory(category: string) {
    return await this.prisma.checklistTemplate.findMany({
      where: { category },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, dto: UpdateChecklistTemplateDto) {
    await this.findOne(id);
    return await this.prisma.checklistTemplate.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.checklistTemplate.delete({ where: { id } });
    return { message: 'Checklist template deleted successfully' };
  }
}

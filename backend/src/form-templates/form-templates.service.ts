import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';

@Injectable()
export class FormTemplatesService {
  constructor(private prisma: PrismaService) {}

  async create(createFormTemplateDto: CreateFormTemplateDto) {
    return await this.prisma.formTemplate.create({
      data: createFormTemplateDto,
    });
  }

  async findAll(page: number = 1, limit: number = 20, active?: boolean, category?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (active !== undefined) where.active = active;
    if (category) where.category = category;

    const [data, total] = await Promise.all([
      this.prisma.formTemplate.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.formTemplate.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const formTemplate = await this.prisma.formTemplate.findUnique({
      where: { id },
      include: { submissions: { take: 10, orderBy: { submissionDate: 'desc' } }, automations: true },
    });
    if (!formTemplate) throw new NotFoundException('Form template not found');
    return formTemplate;
  }

  async update(id: string, updateFormTemplateDto: UpdateFormTemplateDto) {
    await this.findOne(id);
    return await this.prisma.formTemplate.update({ where: { id }, data: updateFormTemplateDto });
  }

  async toggleActive(id: string) {
    const template = await this.findOne(id);
    return await this.prisma.formTemplate.update({ where: { id }, data: { active: !template.active } });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.formTemplate.delete({ where: { id } });
    return { message: 'Form template deleted successfully' };
  }
}

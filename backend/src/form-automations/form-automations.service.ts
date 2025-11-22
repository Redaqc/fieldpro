import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormAutomationDto } from './dto/create-form-automation.dto';
import { UpdateFormAutomationDto } from './dto/update-form-automation.dto';

@Injectable()
export class FormAutomationsService {
  constructor(private prisma: PrismaService) {}

  async create(createFormAutomationDto: CreateFormAutomationDto) {
    const template = await this.prisma.formTemplate.findUnique({ where: { id: createFormAutomationDto.formTemplateId } });
    if (!template) throw new NotFoundException('Form template not found');

    return await this.prisma.formAutomation.create({
      data: createFormAutomationDto,
      include: { formTemplate: true },
    });
  }

  async findAll(page: number = 1, limit: number = 20, formTemplateId?: string, active?: boolean) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (formTemplateId) where.formTemplateId = formTemplateId;
    if (active !== undefined) where.active = active;

    const [data, total] = await Promise.all([
      this.prisma.formAutomation.findMany({ where, skip, take: limit, include: { formTemplate: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.formAutomation.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const automation = await this.prisma.formAutomation.findUnique({
      where: { id },
      include: { formTemplate: true },
    });
    if (!automation) throw new NotFoundException('Form automation not found');
    return automation;
  }

  async update(id: string, updateFormAutomationDto: UpdateFormAutomationDto) {
    await this.findOne(id);
    return await this.prisma.formAutomation.update({ where: { id }, data: updateFormAutomationDto, include: { formTemplate: true } });
  }

  async toggleActive(id: string) {
    const automation = await this.findOne(id);
    return await this.prisma.formAutomation.update({ where: { id }, data: { active: !automation.active }, include: { formTemplate: true } });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.formAutomation.delete({ where: { id } });
    return { message: 'Form automation deleted successfully' };
  }
}

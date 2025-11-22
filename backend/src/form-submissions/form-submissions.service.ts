import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormSubmissionDto } from './dto/create-form-submission.dto';
import { UpdateFormSubmissionDto } from './dto/update-form-submission.dto';

@Injectable()
export class FormSubmissionsService {
  constructor(private prisma: PrismaService) {}

  async create(createFormSubmissionDto: CreateFormSubmissionDto) {
    const template = await this.prisma.formTemplate.findUnique({ where: { id: createFormSubmissionDto.formTemplateId } });
    if (!template) throw new NotFoundException('Form template not found');

    return await this.prisma.formSubmission.create({
      data: createFormSubmissionDto,
      include: { formTemplate: true, user: { select: { id: true, firstName: true, lastName: true } }, job: true },
    });
  }

  async findAll(page: number = 1, limit: number = 20, formTemplateId?: string, submittedBy?: string, jobId?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (formTemplateId) where.formTemplateId = formTemplateId;
    if (submittedBy) where.submittedBy = submittedBy;
    if (jobId) where.jobId = jobId;

    const [data, total] = await Promise.all([
      this.prisma.formSubmission.findMany({ where, skip, take: limit, include: { formTemplate: true, user: { select: { id: true, firstName: true, lastName: true } }, job: true }, orderBy: { submissionDate: 'desc' } }),
      this.prisma.formSubmission.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const submission = await this.prisma.formSubmission.findUnique({
      where: { id },
      include: { formTemplate: true, user: { select: { id: true, firstName: true, lastName: true, email: true } }, job: true },
    });
    if (!submission) throw new NotFoundException('Form submission not found');
    return submission;
  }

  async update(id: string, updateFormSubmissionDto: UpdateFormSubmissionDto) {
    await this.findOne(id);
    return await this.prisma.formSubmission.update({ where: { id }, data: updateFormSubmissionDto, include: { formTemplate: true, user: true, job: true } });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.formSubmission.delete({ where: { id } });
    return { message: 'Form submission deleted successfully' };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}
  async create(dto: CreateDocumentDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.uploadedBy } });
    if (!user) throw new NotFoundException('User not found');
    return await this.prisma.document.create({ data: dto, include: { user: { select: { id: true, firstName: true, lastName: true } } } });
  }
  async findAll(page = 1, limit = 20, uploadedBy?: string, entityType?: string, entityId?: string, category?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (uploadedBy) where.uploadedBy = uploadedBy;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (category) where.category = category;
    const [data, total] = await Promise.all([
      this.prisma.document.findMany({ where, skip, take: limit, include: { user: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { uploadedAt: 'desc' } }),
      this.prisma.document.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id }, include: { user: true } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }
  async update(id: string, dto: UpdateDocumentDto) {
    await this.findOne(id);
    return await this.prisma.document.update({ where: { id }, data: dto, include: { user: true } });
  }
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.document.delete({ where: { id } });
    return { message: 'Document deleted successfully' };
  }
}

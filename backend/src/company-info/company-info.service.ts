import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyInfoDto } from './dto/create-company-info.dto';
import { UpdateCompanyInfoDto } from './dto/update-company-info.dto';

@Injectable()
export class CompanyInfoService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCompanyInfoDto) {
    return await this.prisma.companyInfo.create({ data: dto });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.companyInfo.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.companyInfo.count(),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const info = await this.prisma.companyInfo.findUnique({ where: { id } });
    if (!info) throw new NotFoundException('Company info not found');
    return info;
  }

  async getCurrent() {
    const info = await this.prisma.companyInfo.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!info) throw new NotFoundException('No company info configured');
    return info;
  }

  async update(id: string, dto: UpdateCompanyInfoDto) {
    await this.findOne(id);
    return await this.prisma.companyInfo.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.companyInfo.delete({ where: { id } });
    return { message: 'Company info deleted successfully' };
  }
}

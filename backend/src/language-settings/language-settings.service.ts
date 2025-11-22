import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLanguageSettingsDto } from './dto/create-language-settings.dto';
import { UpdateLanguageSettingsDto } from './dto/update-language-settings.dto';

@Injectable()
export class LanguageSettingsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLanguageSettingsDto) {
    if (dto.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
      if (!user) throw new NotFoundException('User not found');

      const existing = await this.prisma.languageSettings.findUnique({ where: { userId: dto.userId } });
      if (existing) throw new ConflictException('Language settings already exist for this user');
    }

    return await this.prisma.languageSettings.create({
      data: dto,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.languageSettings.findMany({
        skip,
        take: limit,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      }),
      this.prisma.languageSettings.count(),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const settings = await this.prisma.languageSettings.findUnique({
      where: { id },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    if (!settings) throw new NotFoundException('Language settings not found');
    return settings;
  }

  async findByUserId(userId: string) {
    const settings = await this.prisma.languageSettings.findUnique({
      where: { userId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    if (!settings) throw new NotFoundException('Language settings not found for this user');
    return settings;
  }

  async update(id: string, dto: UpdateLanguageSettingsDto) {
    await this.findOne(id);
    return await this.prisma.languageSettings.update({
      where: { id },
      data: dto,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.languageSettings.delete({ where: { id } });
    return { message: 'Language settings deleted successfully' };
  }
}

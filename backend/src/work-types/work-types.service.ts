import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkTypeDto } from './dto/create-work-type.dto';
import { UpdateWorkTypeDto } from './dto/update-work-type.dto';

@Injectable()
export class WorkTypesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new work type
   */
  async create(createWorkTypeDto: CreateWorkTypeDto) {
    // Check if name already exists
    const existingWorkType = await this.prisma.workType.findUnique({
      where: { name: createWorkTypeDto.name },
    });

    if (existingWorkType) {
      throw new ConflictException('Work type name already exists');
    }

    const workType = await this.prisma.workType.create({
      data: createWorkTypeDto,
    });

    return workType;
  }

  /**
   * Get all work types with filters and pagination
   */
  async findAll(
    page: number = 1,
    limit: number = 20,
    active?: boolean,
    search?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (active !== undefined) {
      where.active = active;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { labelFr: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.workType.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          name: 'asc',
        },
      }),
      this.prisma.workType.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get work type by ID
   */
  async findOne(id: string) {
    const workType = await this.prisma.workType.findUnique({
      where: { id },
    });

    if (!workType) {
      throw new NotFoundException('Work type not found');
    }

    return workType;
  }

  /**
   * Update work type
   */
  async update(id: string, updateWorkTypeDto: UpdateWorkTypeDto) {
    // Verify work type exists
    await this.findOne(id);

    // If updating name, check uniqueness
    if (updateWorkTypeDto.name) {
      const existingWorkType = await this.prisma.workType.findUnique({
        where: { name: updateWorkTypeDto.name },
      });

      if (existingWorkType && existingWorkType.id !== id) {
        throw new ConflictException('Work type name already exists');
      }
    }

    const workType = await this.prisma.workType.update({
      where: { id },
      data: updateWorkTypeDto,
    });

    return workType;
  }

  /**
   * Toggle active status
   */
  async toggleActive(id: string) {
    const workType = await this.findOne(id);

    return await this.prisma.workType.update({
      where: { id },
      data: { active: !workType.active },
    });
  }

  /**
   * Get work type statistics
   */
  async getStatistics() {
    const [total, active, inactive, avgDuration, avgPrice] = await Promise.all([
      this.prisma.workType.count(),
      this.prisma.workType.count({ where: { active: true } }),
      this.prisma.workType.count({ where: { active: false } }),
      this.prisma.workType.aggregate({
        where: { defaultDuration: { not: null } },
        _avg: { defaultDuration: true },
      }),
      this.prisma.workType.aggregate({
        where: { defaultPrice: { not: null } },
        _avg: { defaultPrice: true },
      }),
    ]);

    return {
      totalWorkTypes: total,
      active,
      inactive,
      averageDefaultDuration: avgDuration._avg.defaultDuration || 0,
      averageDefaultPrice: avgPrice._avg.defaultPrice || 0,
    };
  }

  /**
   * Remove work type
   */
  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.workType.delete({
      where: { id },
    });

    return { message: 'Work type deleted successfully' };
  }
}

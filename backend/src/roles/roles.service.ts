import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Role with this name already exists');

    return await this.prisma.role.create({
      data: dto,
      include: { technicians: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.role.findMany({
        skip,
        take: limit,
        include: {
          technicians: {
            include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.role.count(),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        technicians: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
      },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async findByName(name: string) {
    const role = await this.prisma.role.findUnique({
      where: { name },
      include: {
        technicians: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
      },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async getStatistics() {
    const [total, withTechnicians] = await Promise.all([
      this.prisma.role.count(),
      this.prisma.role.count({ where: { technicians: { some: {} } } }),
    ]);

    const rolesWithCounts = await this.prisma.role.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { technicians: true } },
      },
    });

    return { total, withTechnicians, rolesWithCounts };
  }

  async update(id: string, dto: UpdateRoleDto) {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.role.findUnique({ where: { name: dto.name } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Role with this name already exists');
      }
    }

    return await this.prisma.role.update({
      where: { id },
      data: dto,
      include: {
        technicians: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
      },
    });
  }

  async remove(id: string) {
    const role = await this.findOne(id);

    if (role.technicians.length > 0) {
      throw new ConflictException('Cannot delete role with assigned technicians');
    }

    await this.prisma.role.delete({ where: { id } });
    return { message: 'Role deleted successfully' };
  }
}

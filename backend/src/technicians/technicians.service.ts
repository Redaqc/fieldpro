import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';

@Injectable()
export class TechniciansService {
  constructor(private prisma: PrismaService) {}

  async create(createTechnicianDto: CreateTechnicianDto) {
    // Verify user exists and has TECHNICIAN role
    const user = await this.prisma.user.findUnique({
      where: { id: createTechnicianDto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if technician profile already exists for this user
    const existing = await this.prisma.technician.findUnique({
      where: { userId: createTechnicianDto.userId },
    });

    if (existing) {
      throw new ConflictException('Technician profile already exists for this user');
    }

    const technician = await this.prisma.technician.create({
      data: {
        ...createTechnicianDto,
        workingHours: createTechnicianDto.workingHours
          ? JSON.stringify(createTechnicianDto.workingHours)
          : null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });

    return {
      ...technician,
      workingHours: technician.workingHours ? JSON.parse(technician.workingHours as string) : null,
    };
  }

  async findAll(page = 1, limit = 20, isAvailable?: boolean) {
    const skip = (page - 1) * limit;

    const where = isAvailable !== undefined ? { isAvailable } : {};

    const [technicians, total] = await Promise.all([
      this.prisma.technician.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.technician.count({ where }),
    ]);

    return {
      data: technicians.map((tech) => ({
        ...tech,
        workingHours: tech.workingHours ? JSON.parse(tech.workingHours as string) : null,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const technician = await this.prisma.technician.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
        jobAssignments: {
          include: {
            job: {
              include: {
                customer: true,
              },
            },
          },
          take: 10,
          orderBy: { job: { scheduledStart: 'desc' } },
        },
      },
    });

    if (!technician) {
      throw new NotFoundException(`Technician with ID ${id} not found`);
    }

    return {
      ...technician,
      workingHours: technician.workingHours ? JSON.parse(technician.workingHours as string) : null,
    };
  }

  async findByUserId(userId: string) {
    const technician = await this.prisma.technician.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });

    if (!technician) {
      throw new NotFoundException(`Technician profile not found for user ${userId}`);
    }

    return {
      ...technician,
      workingHours: technician.workingHours ? JSON.parse(technician.workingHours as string) : null,
    };
  }

  async update(id: string, updateTechnicianDto: UpdateTechnicianDto) {
    // Check if technician exists
    await this.findOne(id);

    const technician = await this.prisma.technician.update({
      where: { id },
      data: {
        ...updateTechnicianDto,
        workingHours: updateTechnicianDto.workingHours
          ? JSON.stringify(updateTechnicianDto.workingHours)
          : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });

    return {
      ...technician,
      workingHours: technician.workingHours ? JSON.parse(technician.workingHours as string) : null,
    };
  }

  async updateLocation(id: string, latitude: number, longitude: number) {
    const technician = await this.prisma.technician.update({
      where: { id },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        lastLocationUpdate: new Date(),
      },
    });

    return technician;
  }

  async remove(id: string) {
    // Check if technician exists
    await this.findOne(id);

    // Delete technician profile
    await this.prisma.technician.delete({
      where: { id },
    });

    return { message: 'Technician profile deleted successfully' };
  }
}

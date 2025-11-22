import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobStatus } from '@prisma/client';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async create(createJobDto: CreateJobDto) {
    const { technicianIds, ...jobData } = createJobDto;

    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: createJobDto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Generate job number if not provided
    if (!jobData.jobNumber) {
      const count = await this.prisma.job.count();
      const year = new Date().getFullYear();
      jobData.jobNumber = `JOB-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    // Create job with technician assignments
    const job = await this.prisma.job.create({
      data: {
        ...jobData,
        scheduledStart: jobData.scheduledStart ? new Date(jobData.scheduledStart) : null,
        scheduledEnd: jobData.scheduledEnd ? new Date(jobData.scheduledEnd) : null,
        technicians: technicianIds
          ? {
              create: technicianIds.map((techId) => ({
                technicianId: techId,
              })),
            }
          : undefined,
      },
      include: {
        customer: true,
        technicians: {
          include: {
            technician: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return job;
  }

  async findAll(
    page = 1,
    limit = 20,
    status?: JobStatus,
    customerId?: string,
    technicianId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (technicianId) {
      where.technicians = {
        some: {
          technicianId,
        },
      };
    }

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
          technicians: {
            include: {
              technician: {
                include: {
                  user: {
                    select: {
                      fullName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data: jobs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        customer: true,
        technicians: {
          include: {
            technician: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
        timeEntries: true,
        documents: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    return job;
  }

  async update(id: string, updateJobDto: UpdateJobDto) {
    const { technicianIds, ...jobData } = updateJobDto;

    // Check if job exists
    await this.findOne(id);

    // If updating technicians, replace all assignments
    if (technicianIds !== undefined) {
      await this.prisma.jobTechnician.deleteMany({
        where: { jobId: id },
      });
    }

    const job = await this.prisma.job.update({
      where: { id },
      data: {
        ...jobData,
        scheduledStart: jobData.scheduledStart ? new Date(jobData.scheduledStart) : undefined,
        scheduledEnd: jobData.scheduledEnd ? new Date(jobData.scheduledEnd) : undefined,
        technicians:
          technicianIds !== undefined
            ? {
                create: technicianIds.map((techId) => ({
                  technicianId: techId,
                })),
              }
            : undefined,
      },
      include: {
        customer: true,
        technicians: {
          include: {
            technician: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return job;
  }

  async updateStatus(id: string, status: JobStatus) {
    const job = await this.findOne(id);

    const updatedJob = await this.prisma.job.update({
      where: { id },
      data: {
        status,
        ...(status === JobStatus.IN_PROGRESS && { actualStart: new Date() }),
        ...(status === JobStatus.COMPLETED && { actualEnd: new Date() }),
      },
      include: {
        customer: true,
        technicians: {
          include: {
            technician: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return updatedJob;
  }

  async remove(id: string) {
    // Check if job exists
    await this.findOne(id);

    // Delete job (cascade will handle related records based on schema)
    await this.prisma.job.delete({
      where: { id },
    });

    return { message: 'Job deleted successfully' };
  }
}

import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceCallDto } from './dto/create-service-call.dto';
import { UpdateServiceCallDto } from './dto/update-service-call.dto';
import { ServiceCallStatus, JobPriority } from '@prisma/client';

@Injectable()
export class ServiceCallsService {
  constructor(private prisma: PrismaService) {}

  async create(createServiceCallDto: CreateServiceCallDto) {
    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: createServiceCallDto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Generate call number if not provided
    if (!createServiceCallDto.callNumber) {
      const count = await this.prisma.serviceCall.count();
      const year = new Date().getFullYear();
      createServiceCallDto.callNumber = `SC-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    // Create service call
    const serviceCall = await this.prisma.serviceCall.create({
      data: {
        ...createServiceCallDto,
        scheduledDate: createServiceCallDto.scheduledDate
          ? new Date(createServiceCallDto.scheduledDate)
          : null,
      },
      include: {
        customer: true,
      },
    });

    return serviceCall;
  }

  async findAll(
    page = 1,
    limit = 20,
    status?: ServiceCallStatus,
    priority?: JobPriority,
    customerId?: string,
    assignedTo?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    const [serviceCalls, total] = await Promise.all([
      this.prisma.serviceCall.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.serviceCall.count({ where }),
    ]);

    return {
      data: serviceCalls,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const serviceCall = await this.prisma.serviceCall.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!serviceCall) {
      throw new NotFoundException(`ServiceCall with ID ${id} not found`);
    }

    return serviceCall;
  }

  async update(id: string, updateServiceCallDto: UpdateServiceCallDto) {
    // Check if service call exists
    await this.findOne(id);

    const serviceCall = await this.prisma.serviceCall.update({
      where: { id },
      data: {
        ...updateServiceCallDto,
        scheduledDate: updateServiceCallDto.scheduledDate
          ? new Date(updateServiceCallDto.scheduledDate)
          : undefined,
      },
      include: {
        customer: true,
      },
    });

    return serviceCall;
  }

  async updateStatus(id: string, status: ServiceCallStatus) {
    const serviceCall = await this.findOne(id);

    const updatedServiceCall = await this.prisma.serviceCall.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
      },
    });

    return updatedServiceCall;
  }

  async assignTechnician(id: string, technicianId: string) {
    // Verify service call exists
    await this.findOne(id);

    // Update assignment
    const serviceCall = await this.prisma.serviceCall.update({
      where: { id },
      data: {
        assignedTo: technicianId,
        status: ServiceCallStatus.IN_PROGRESS,
      },
      include: {
        customer: true,
      },
    });

    return serviceCall;
  }

  async getStatistics(customerId?: string, assignedTo?: string) {
    const where = customerId
      ? { customerId }
      : assignedTo
      ? { assignedTo }
      : {};

    const [
      totalCalls,
      openCalls,
      inProgressCalls,
      resolvedCalls,
      closedCalls,
      byPriority,
    ] = await Promise.all([
      this.prisma.serviceCall.count({ where }),
      this.prisma.serviceCall.count({ where: { ...where, status: ServiceCallStatus.OPEN } }),
      this.prisma.serviceCall.count({ where: { ...where, status: ServiceCallStatus.IN_PROGRESS } }),
      this.prisma.serviceCall.count({ where: { ...where, status: ServiceCallStatus.RESOLVED } }),
      this.prisma.serviceCall.count({ where: { ...where, status: ServiceCallStatus.CLOSED } }),
      this.prisma.serviceCall.groupBy({
        by: ['priority'],
        where,
        _count: true,
      }),
    ]);

    return {
      totalCalls,
      byStatus: {
        open: openCalls,
        inProgress: inProgressCalls,
        resolved: resolvedCalls,
        closed: closedCalls,
      },
      byPriority: byPriority.map((p) => ({
        priority: p.priority,
        count: p._count,
      })),
    };
  }

  async remove(id: string) {
    // Check if service call exists
    await this.findOne(id);

    // Delete service call
    await this.prisma.serviceCall.delete({
      where: { id },
    });

    return { message: 'ServiceCall deleted successfully' };
  }
}

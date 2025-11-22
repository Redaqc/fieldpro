import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetStatus } from '@prisma/client';

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async create(createAssetDto: CreateAssetDto) {
    // Generate asset number if not provided
    if (!createAssetDto.assetNumber) {
      const count = await this.prisma.asset.count();
      const year = new Date().getFullYear();
      createAssetDto.assetNumber = `ASSET-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    // Check if asset number already exists
    const existing = await this.prisma.asset.findUnique({
      where: { assetNumber: createAssetDto.assetNumber },
    });

    if (existing) {
      throw new ConflictException('Asset with this asset number already exists');
    }

    // Verify technician exists if assigned
    if (createAssetDto.assignedTo) {
      const technician = await this.prisma.technician.findUnique({
        where: { id: createAssetDto.assignedTo },
      });

      if (!technician) {
        throw new NotFoundException('Technician not found');
      }
    }

    const asset = await this.prisma.asset.create({
      data: {
        ...createAssetDto,
        purchaseDate: createAssetDto.purchaseDate ? new Date(createAssetDto.purchaseDate) : null,
        warrantyExpiry: createAssetDto.warrantyExpiry ? new Date(createAssetDto.warrantyExpiry) : null,
      },
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
    });

    return asset;
  }

  async findAll(
    page = 1,
    limit = 20,
    status?: AssetStatus,
    location?: string,
    assignedTo?: string,
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (location) {
      where.location = location;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { assetNumber: { contains: search, mode: 'insensitive' as const } },
        { brand: { contains: search, mode: 'insensitive' as const } },
        { model: { contains: search, mode: 'insensitive' as const } },
        { serialNumber: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const [assets, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        skip,
        take: limit,
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
          maintenanceSchedules: {
            take: 5,
            orderBy: { scheduledDate: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.asset.count({ where }),
    ]);

    return {
      data: assets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
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
        maintenanceSchedules: {
          orderBy: { scheduledDate: 'desc' },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    return asset;
  }

  async update(id: string, updateAssetDto: UpdateAssetDto) {
    // Check if asset exists
    await this.findOne(id);

    // If updating asset number, check it's not taken
    if (updateAssetDto.assetNumber) {
      const existing = await this.prisma.asset.findUnique({
        where: { assetNumber: updateAssetDto.assetNumber },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Asset number already in use');
      }
    }

    const asset = await this.prisma.asset.update({
      where: { id },
      data: {
        ...updateAssetDto,
        purchaseDate: updateAssetDto.purchaseDate ? new Date(updateAssetDto.purchaseDate) : undefined,
        warrantyExpiry: updateAssetDto.warrantyExpiry ? new Date(updateAssetDto.warrantyExpiry) : undefined,
      },
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
    });

    return asset;
  }

  async updateStatus(id: string, status: AssetStatus) {
    const asset = await this.findOne(id);

    const updatedAsset = await this.prisma.asset.update({
      where: { id },
      data: { status },
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
    });

    return updatedAsset;
  }

  async assignTechnician(id: string, technicianId: string | null) {
    // Verify asset exists
    await this.findOne(id);

    // Verify technician exists if assigning
    if (technicianId) {
      const technician = await this.prisma.technician.findUnique({
        where: { id: technicianId },
      });

      if (!technician) {
        throw new NotFoundException('Technician not found');
      }
    }

    const asset = await this.prisma.asset.update({
      where: { id },
      data: { assignedTo: technicianId },
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
    });

    return asset;
  }

  async getStatistics(status?: AssetStatus, location?: string) {
    const where = status
      ? { status }
      : location
      ? { location }
      : {};

    const [
      totalAssets,
      activeAssets,
      maintenanceAssets,
      retiredAssets,
      disposedAssets,
      byLocation,
    ] = await Promise.all([
      this.prisma.asset.count({ where }),
      this.prisma.asset.count({ where: { ...where, status: AssetStatus.ACTIVE } }),
      this.prisma.asset.count({ where: { ...where, status: AssetStatus.MAINTENANCE } }),
      this.prisma.asset.count({ where: { ...where, status: AssetStatus.RETIRED } }),
      this.prisma.asset.count({ where: { ...where, status: AssetStatus.DISPOSED } }),
      this.prisma.asset.groupBy({
        by: ['location'],
        where,
        _count: true,
      }),
    ]);

    return {
      totalAssets,
      byStatus: {
        active: activeAssets,
        maintenance: maintenanceAssets,
        retired: retiredAssets,
        disposed: disposedAssets,
      },
      byLocation: byLocation.map((l) => ({
        location: l.location,
        count: l._count,
      })),
    };
  }

  async remove(id: string) {
    // Check if asset exists
    await this.findOne(id);

    // Delete asset
    await this.prisma.asset.delete({
      where: { id },
    });

    return { message: 'Asset deleted successfully' };
  }
}

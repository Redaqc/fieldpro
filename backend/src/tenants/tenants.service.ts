import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new tenant
   */
  async create(createDto: CreateTenantDto) {
    // Check if slug already exists
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: createDto.slug },
    });

    if (existing) {
      throw new BadRequestException('Tenant slug already exists');
    }

    // Generate schema name from slug
    const schema_name = `tenant_${createDto.slug}`;

    // Create tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        slug: createDto.slug,
        name: createDto.name,
        plan: createDto.plan || 'starter',
        max_users: createDto.max_users || 10,
        max_jobs: createDto.max_jobs || 100,
        max_storage_gb: createDto.max_storage_gb || 5,
        settings: createDto.settings || {},
        schema_name,
        status: 'active',
      },
    });

    // Create tenant schema
    try {
      await this.createTenantSchema(schema_name);
      this.logger.log(`Created schema for tenant: ${schema_name}`);
    } catch (error) {
      // Rollback tenant creation if schema creation fails
      await this.prisma.tenant.delete({ where: { id: tenant.id } });
      this.logger.error(`Failed to create schema for tenant: ${schema_name}`, error);
      throw new BadRequestException('Failed to create tenant schema');
    }

    return tenant;
  }

  /**
   * Get all tenants
   */
  async findAll(filters?: any) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.plan) {
      where.plan = filters.plan;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.tenant.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get a single tenant by ID
   */
  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  /**
   * Find tenant by slug
   */
  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  /**
   * Update a tenant
   */
  async update(id: string, updateDto: UpdateTenantDto) {
    await this.findOne(id);

    return this.prisma.tenant.update({
      where: { id },
      data: updateDto,
    });
  }

  /**
   * Delete a tenant
   */
  async delete(id: string) {
    const tenant = await this.findOne(id);

    // Drop tenant schema
    try {
      await this.dropTenantSchema(tenant.schema_name);
      this.logger.log(`Dropped schema for tenant: ${tenant.schema_name}`);
    } catch (error) {
      this.logger.error(`Failed to drop schema for tenant: ${tenant.schema_name}`, error);
      throw new BadRequestException('Failed to delete tenant schema');
    }

    return this.prisma.tenant.delete({
      where: { id },
    });
  }

  /**
   * Suspend a tenant
   */
  async suspend(id: string) {
    return this.update(id, { status: 'suspended' });
  }

  /**
   * Activate a tenant
   */
  async activate(id: string) {
    return this.update(id, { status: 'active' });
  }

  /**
   * Get tenant users
   */
  async getTenantUsers(tenantId: string) {
    await this.findOne(tenantId);

    return this.prisma.tenantUser.findMany({
      where: { tenant_id: tenantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            avatar_url: true,
          },
        },
      },
      orderBy: {
        joined_at: 'desc',
      },
    });
  }

  /**
   * Get tenant invitations
   */
  async getTenantInvitations(tenantId: string) {
    await this.findOne(tenantId);

    return this.prisma.invitation.findMany({
      where: { tenant_id: tenantId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get tenant statistics
   */
  async getTenantStats(tenantId: string) {
    const tenant = await this.findOne(tenantId);

    const userCount = await this.prisma.tenantUser.count({
      where: { tenant_id: tenantId, is_active: true },
    });

    const invitationCount = await this.prisma.invitation.count({
      where: { tenant_id: tenantId, accepted_at: null },
    });

    return {
      tenant,
      active_users: userCount,
      pending_invitations: invitationCount,
      user_limit: tenant.max_users,
      user_usage_percent: (userCount / tenant.max_users) * 100,
    };
  }

  /**
   * Update tenant subscription
   */
  async updateSubscription(
    tenantId: string,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    expiresAt: Date,
  ) {
    return this.update(tenantId, {
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      subscription_expires_at: expiresAt,
    });
  }

  /**
   * Check if tenant can add more users
   */
  async canAddUser(tenantId: string): Promise<boolean> {
    const tenant = await this.findOne(tenantId);

    const userCount = await this.prisma.tenantUser.count({
      where: { tenant_id: tenantId, is_active: true },
    });

    return userCount < tenant.max_users;
  }

  /**
   * Create tenant schema in database
   */
  private async createTenantSchema(schemaName: string) {
    await this.prisma.$executeRawUnsafe(
      `SELECT create_tenant_schema($1)`,
      schemaName
    );
  }

  /**
   * Drop tenant schema from database
   */
  private async dropTenantSchema(schemaName: string) {
    await this.prisma.$executeRawUnsafe(
      `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`
    );
  }

  /**
   * Get all tenants with usage statistics
   */
  async findAllWithStats() {
    const tenants = await this.findAll();

    const tenantsWithStats = await Promise.all(
      tenants.map(async (tenant: any) => {
        const userCount = await this.prisma.tenantUser.count({
          where: { tenant_id: tenant.id, is_active: true },
        });

        return {
          ...tenant,
          active_users: userCount,
          user_usage_percent: (userCount / tenant.max_users) * 100,
        };
      })
    );

    return tenantsWithStats;
  }
}

import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new user
   */
  async create(createDto: CreateUserDto) {
    // Check if email already exists
    const existing = await this.findByEmail(createDto.email);
    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    // Hash password
    const password_hash = await bcrypt.hash(createDto.password, 10);

    return this.prisma.user.create({
      data: {
        email: createDto.email,
        password_hash,
        first_name: createDto.first_name,
        last_name: createDto.last_name,
        avatar_url: createDto.avatar_url,
        is_super_admin: createDto.is_super_admin ?? false,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        avatar_url: true,
        is_super_admin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get all users (admin only)
   */
  async findAll(filters?: any) {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { first_name: { contains: filters.search, mode: 'insensitive' } },
        { last_name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.is_super_admin !== undefined) {
      where.is_super_admin = filters.is_super_admin === 'true';
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        avatar_url: true,
        is_super_admin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get a single user by ID
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        avatar_url: true,
        is_super_admin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Update user profile
   */
  async update(id: string, updateDto: UpdateUserDto) {
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: updateDto,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        avatar_url: true,
        is_super_admin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Delete a user
   */
  async delete(id: string) {
    await this.findOne(id);

    // Check if user is the last super admin
    if (await this.isLastSuperAdmin(id)) {
      throw new BadRequestException('Cannot delete the last super admin');
    }

    return this.prisma.user.delete({
      where: { id },
      select: {
        id: true,
        email: true,
      },
    });
  }

  /**
   * Change user password
   */
  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.password_hash) {
      throw new BadRequestException('User does not have a password set');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      changePasswordDto.current_password,
      user.password_hash
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const password_hash = await bcrypt.hash(changePasswordDto.new_password, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password_hash },
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Get user's tenant memberships
   */
  async getUserTenants(userId: string) {
    await this.findOne(userId);

    return this.prisma.tenantUser.findMany({
      where: { user_id: userId },
      include: {
        tenant: {
          select: {
            id: true,
            slug: true,
            name: true,
            status: true,
            plan: true,
          },
        },
      },
      orderBy: {
        joined_at: 'desc',
      },
    });
  }

  /**
   * Add user to tenant
   */
  async addUserToTenant(userId: string, tenantId: string, role: string) {
    await this.findOne(userId);

    // Check if already a member
    const existing = await this.prisma.tenantUser.findUnique({
      where: {
        tenant_id_user_id: {
          tenant_id: tenantId,
          user_id: userId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('User is already a member of this tenant');
    }

    return this.prisma.tenantUser.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        role,
        is_active: true,
      },
    });
  }

  /**
   * Remove user from tenant
   */
  async removeUserFromTenant(userId: string, tenantId: string) {
    const tenantUser = await this.prisma.tenantUser.findUnique({
      where: {
        tenant_id_user_id: {
          tenant_id: tenantId,
          user_id: userId,
        },
      },
    });

    if (!tenantUser) {
      throw new NotFoundException('User is not a member of this tenant');
    }

    return this.prisma.tenantUser.delete({
      where: {
        id: tenantUser.id,
      },
    });
  }

  /**
   * Update user role in tenant
   */
  async updateUserRole(userId: string, tenantId: string, role: string) {
    const tenantUser = await this.prisma.tenantUser.findUnique({
      where: {
        tenant_id_user_id: {
          tenant_id: tenantId,
          user_id: userId,
        },
      },
    });

    if (!tenantUser) {
      throw new NotFoundException('User is not a member of this tenant');
    }

    return this.prisma.tenantUser.update({
      where: { id: tenantUser.id },
      data: { role },
    });
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    const user = await this.findOne(userId);

    const tenantCount = await this.prisma.tenantUser.count({
      where: { user_id: userId, is_active: true },
    });

    const invitationCount = await this.prisma.invitation.count({
      where: { email: user.email, accepted_at: null },
    });

    return {
      user,
      tenant_count: tenantCount,
      pending_invitations: invitationCount,
    };
  }

  /**
   * Check if user is the last super admin
   */
  private async isLastSuperAdmin(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.is_super_admin) {
      return false;
    }

    const superAdminCount = await this.prisma.user.count({
      where: { is_super_admin: true },
    });

    return superAdminCount === 1;
  }
}

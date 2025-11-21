import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, tenantSlug, tenantName } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
      },
    });

    let tenant;
    if (tenantSlug && tenantName) {
      const schemaName = `tenant_${tenantSlug}`;

      tenant = await this.prisma.tenant.create({
        data: {
          slug: tenantSlug,
          name: tenantName,
          schema_name: schemaName,
          status: 'active',
          plan: 'starter',
        },
      });

      await this.prisma.$executeRawUnsafe(
        `SELECT create_tenant_schema('${schemaName}')`
      );

      await this.prisma.tenantUser.create({
        data: {
          tenant_id: tenant.id,
          user_id: user.id,
          role: 'admin',
        },
      });
    }

    const tokens = await this.generateTokens(user, tenant);

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      tenant: tenant ? {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
      } : null,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password, tenantSlug } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new UnauthorizedException('Tenant not found');
    }

    const tenantUser = await this.prisma.tenantUser.findFirst({
      where: {
        user_id: user.id,
        tenant_id: tenant.id,
        is_active: true,
      },
    });

    if (!tenantUser) {
      throw new UnauthorizedException('User not authorized for this tenant');
    }

    const tokens = await this.generateTokens(user, tenant, tenantUser);

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
      },
      role: tenantUser.role,
      ...tokens,
    };
  }

  async me(userId: string, tenantId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        avatar_url: true,
      },
    });

    const tenantUser = await this.prisma.tenantUser.findFirst({
      where: {
        user_id: userId,
        tenant_id: tenantId,
      },
      include: {
        tenant: {
          select: {
            id: true,
            slug: true,
            name: true,
            plan: true,
          },
        },
      },
    });

    return {
      ...user,
      role: tenantUser?.role,
      tenant: tenantUser?.tenant,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const tenant = await this.prisma.tenant.findUnique({
        where: { id: decoded.tenantId },
      });

      const tenantUser = await this.prisma.tenantUser.findFirst({
        where: {
          user_id: user.id,
          tenant_id: decoded.tenantId,
        },
      });

      return this.generateTokens(user, tenant, tenantUser);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(user: any, tenant: any, tenantUser?: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: tenant?.id,
      tenantSlug: tenant?.slug,
      role: tenantUser?.role || 'admin',
      permissions: tenantUser?.permissions || {},
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}

import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, first_name, last_name, tenant_slug, tenant_name } = registerDto;

    // ✅ FIXED: Validate tenant slug format to prevent SQL injection
    if (tenant_slug && !/^[a-z0-9-]+$/.test(tenant_slug)) {
      throw new BadRequestException('Tenant slug must contain only lowercase letters, numbers, and hyphens');
    }

    if (tenant_slug && (tenant_slug.length < 3 || tenant_slug.length > 63)) {
      throw new BadRequestException('Tenant slug must be between 3 and 63 characters');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12); // ✅ Increased rounds to 12

    const user = await this.prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        first_name,
        last_name,
      },
    });

    let tenant;
    if (tenant_slug && tenant_name) {
      // ✅ FIXED: Sanitize schema name and use parameterized query
      const schemaName = `tenant_${tenant_slug.replace(/-/g, '_')}`;

      // Check if tenant already exists
      const existingTenant = await this.prisma.tenant.findUnique({
        where: { slug: tenant_slug },
      });

      if (existingTenant) {
        throw new ConflictException('Tenant already exists');
      }

      tenant = await this.prisma.tenant.create({
        data: {
          slug: tenant_slug,
          name: tenant_name,
          schema_name: schemaName,
          status: 'active',
          plan: 'starter',
        },
      });

      // ✅ FIXED: Use parameterized query instead of string interpolation
      await this.prisma.$executeRaw`SELECT create_tenant_schema(${schemaName})`;

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
    const { email, password, tenant_slug } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // ✅ FIXED: Timing attack prevention - always perform bcrypt comparison
    const dummyHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5uyilBJ3cBfby';
    const passwordHash = user?.password_hash || dummyHash;

    const isPasswordValid = await bcrypt.compare(password, passwordHash);

    if (!user || !user.password_hash || !isPasswordValid) {
      // ✅ SECURITY LOGGING: Log failed login attempts
      this.logger.warn(`Failed login attempt for email: ${email}, tenant: ${tenant_slug}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenant_slug },
    });

    if (!tenant) {
      // ✅ SECURITY LOGGING: Log tenant not found
      this.logger.warn(`Login attempt for non-existent tenant: ${tenant_slug}, user: ${email}`);
      throw new UnauthorizedException('Tenant not found');
    }

    if (tenant.status !== 'active') {
      // ✅ SECURITY LOGGING: Log inactive tenant access attempt
      this.logger.warn(`Login attempt for inactive tenant: ${tenant_slug}, user: ${email}`);
      throw new UnauthorizedException('Tenant is not active');
    }

    const tenantUser = await this.prisma.tenantUser.findFirst({
      where: {
        user_id: user.id,
        tenant_id: tenant.id,
        is_active: true,
      },
    });

    if (!tenantUser) {
      // ✅ SECURITY LOGGING: Log unauthorized tenant access
      this.logger.warn(`Unauthorized tenant access attempt: user ${email} → tenant ${tenant_slug}`);
      throw new UnauthorizedException('User not authorized for this tenant');
    }

    const tokens = await this.generateTokens(user, tenant, tenantUser);

    // ✅ SECURITY LOGGING: Log successful login
    this.logger.log(`Successful login: ${email} → ${tenant_slug} (${tenantUser.role})`);

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

      if (!tenant || tenant.status !== 'active') {
        throw new UnauthorizedException('Tenant not found or inactive');
      }

      const tenantUser = await this.prisma.tenantUser.findFirst({
        where: {
          user_id: user.id,
          tenant_id: decoded.tenantId,
          is_active: true,
        },
      });

      if (!tenantUser) {
        throw new UnauthorizedException('User not authorized for tenant');
      }

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

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    });

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

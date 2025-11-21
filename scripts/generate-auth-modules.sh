#!/bin/bash

set -e

BACKEND="/home/user/fieldpro/backend/src"

echo "🔐 Generating Authentication modules..."

# Create auth module structure
mkdir -p "$BACKEND/auth"/{dto,strategies}
mkdir -p "$BACKEND/tenants/dto"
mkdir -p "$BACKEND/users/dto"

# ===========================
# AUTH MODULE FILES
# ===========================

cat > "$BACKEND/auth/auth.module.ts" << 'EOF'
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
EOF

cat > "$BACKEND/auth/auth.service.ts" << 'EOF'
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
EOF

cat > "$BACKEND/auth/auth.controller.ts" << 'EOF'
import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user and optionally create tenant' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user to tenant' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  async me(
    @CurrentUser() user: any,
    @CurrentTenant() tenant: any,
  ) {
    return this.authService.me(user.sub, tenant.id);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  async logout() {
    return { message: 'Logged out successfully' };
  }
}
EOF

cat > "$BACKEND/auth/dto/login.dto.ts" << 'EOF'
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'redaqc@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'novatel' })
  @IsString()
  @IsNotEmpty()
  tenantSlug: string;
}
EOF

cat > "$BACKEND/auth/dto/register.dto.ts" << 'EOF'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'redaqc@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'Reda' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Red' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'novatel' })
  @IsString()
  @IsOptional()
  tenantSlug?: string;

  @ApiPropertyOptional({ example: 'Novatel Inc.' })
  @IsString()
  @IsOptional()
  tenantName?: string;
}
EOF

cat > "$BACKEND/auth/dto/refresh-token.dto.ts" << 'EOF'
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}
EOF

cat > "$BACKEND/auth/strategies/jwt.strategy.ts" << 'EOF'
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'dev-secret',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return payload;
  }
}
EOF

# ===========================
# TENANTS MODULE
# ===========================

cat > "$BACKEND/tenants/tenants.module.ts" << 'EOF'
import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';

@Module({
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
EOF

cat > "$BACKEND/tenants/tenants.service.ts" << 'EOF'
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tenant.findMany();
  }

  async findOne(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
    });
  }
}
EOF

# ===========================
# USERS MODULE
# ===========================

cat > "$BACKEND/users/users.module.ts" << 'EOF'
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
EOF

cat > "$BACKEND/users/users.service.ts" << 'EOF'
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}
EOF

echo "✅ Auth modules generated successfully!"


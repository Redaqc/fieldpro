#!/bin/bash

# Generate all backend NestJS files automatically
set -e

PROJECT_ROOT="/home/user/fieldpro"
BACKEND="$PROJECT_ROOT/backend/src"

echo "🔨 Generating complete backend structure..."

# ===========================
# PRISMA MODULE
# ===========================

cat > "$BACKEND/prisma/prisma.module.ts" << 'EOF'
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TenantPrismaService } from './tenant-prisma.service';

@Global()
@Module({
  providers: [PrismaService, TenantPrismaService],
  exports: [PrismaService, TenantPrismaService],
})
export class PrismaModule {}
EOF

cat > "$BACKEND/prisma/prisma.service.ts" << 'EOF'
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
EOF

cat > "$BACKEND/prisma/tenant-prisma.service.ts" << 'EOF'
import { Injectable, Scope } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable({ scope: Scope.REQUEST })
export class TenantPrismaService {
  constructor(private prisma: PrismaService) {}

  private tenantSchema: string;

  setTenantSchema(schema: string) {
    this.tenantSchema = schema;
  }

  getTenantSchema(): string {
    return this.tenantSchema;
  }

  async queryRaw<T = any>(query: string, params?: any[]): Promise<T> {
    const fullQuery = query.replace(/\{schema\}/g, this.tenantSchema);
    return this.prisma.$queryRawUnsafe(fullQuery, ...(params || []));
  }

  async executeRaw(query: string, params?: any[]) {
    const fullQuery = query.replace(/\{schema\}/g, this.tenantSchema);
    return this.prisma.$executeRawUnsafe(fullQuery, ...(params || []));
  }

  async findOne(tableName: string, id: string) {
    const result = await this.queryRaw(
      `SELECT * FROM {schema}.${tableName} WHERE id = $1 LIMIT 1`,
      [id],
    );
    return result[0] || null;
  }

  async create(tableName: string, data: any) {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data)
      .map((_, i) => `$${i + 1}`)
      .join(', ');
    const values = Object.values(data);

    const result = await this.queryRaw(
      `INSERT INTO {schema}.${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`,
      values,
    );
    return result[0];
  }

  async update(tableName: string, id: string, data: any) {
    const setClause = Object.keys(data)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');
    const values = [...Object.values(data), id];

    const result = await this.queryRaw(
      `UPDATE {schema}.${tableName} SET ${setClause}, updated_date = NOW() WHERE id = $${values.length} RETURNING *`,
      values,
    );
    return result[0];
  }

  async delete(tableName: string, id: string) {
    await this.executeRaw(
      `DELETE FROM {schema}.${tableName} WHERE id = $1`,
      [id],
    );
    return { id, deleted: true };
  }
}
EOF

echo "✅ Prisma module files created"

# ===========================
# COMMON FILES
# ===========================

mkdir -p "$BACKEND/common"/{decorators,guards,middleware,interceptors,filters,pipes}

cat > "$BACKEND/common/decorators/current-tenant.decorator.ts" << 'EOF'
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return {
      id: request.tenantId,
      slug: request.tenantSlug,
      schema: request.tenantSchema,
    };
  },
);
EOF

cat > "$BACKEND/common/decorators/current-user.decorator.ts" << 'EOF'
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
EOF

cat > "$BACKEND/common/guards/jwt-auth.guard.ts" << 'EOF'
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }
}
EOF

cat > "$BACKEND/common/guards/tenant.guard.ts" << 'EOF'
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (!request.tenantId || !request.tenantSlug) {
      throw new ForbiddenException('Tenant context required');
    }

    return true;
  }
}
EOF

cat > "$BACKEND/common/middleware/logger.middleware.ts" << 'EOF'
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;
      this.logger.log(
        `${method} ${originalUrl} ${statusCode} - ${responseTime}ms`,
      );
    });

    next();
  }
}
EOF

cat > "$BACKEND/common/middleware/tenant.middleware.ts" << 'EOF'
import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantPrismaService } from '../../prisma/tenant-prisma.service';

export interface TenantRequest extends Request {
  tenantId?: string;
  tenantSlug?: string;
  tenantSchema?: string;
  user?: any;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private tenantPrisma: TenantPrismaService,
  ) {}

  async use(req: TenantRequest, res: Response, next: NextFunction) {
    const publicPaths = ['/api/auth/login', '/api/auth/register', '/api/health'];
    if (publicPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    let tenantSlug: string | undefined;

    const host = req.hostname;
    const parts = host.split('.');

    if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'api') {
      tenantSlug = parts[0];
    }

    if (!tenantSlug && req.headers['x-tenant-slug']) {
      tenantSlug = req.headers['x-tenant-slug'] as string;
    }

    if (!tenantSlug) {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        try {
          const decoded = this.jwtService.decode(token) as any;
          if (decoded?.tenantSlug) {
            tenantSlug = decoded.tenantSlug;
          }
        } catch (error) {}
      }
    }

    if (tenantSlug) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: tenantSlug },
      });

      if (!tenant) {
        throw new BadRequestException('Tenant not found');
      }

      if (tenant.status !== 'active') {
        throw new BadRequestException('Tenant is not active');
      }

      req.tenantId = tenant.id;
      req.tenantSlug = tenant.slug;
      req.tenantSchema = tenant.schema_name;

      this.tenantPrisma.setTenantSchema(tenant.schema_name);
    }

    next();
  }
}
EOF

cat > "$BACKEND/common/filters/http-exception.filter.ts" << 'EOF'
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}
EOF

cat > "$BACKEND/common/interceptors/transform.interceptor.ts" << 'EOF'
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
EOF

echo "✅ Common files created"

echo "🎉 Backend structure generation complete!"


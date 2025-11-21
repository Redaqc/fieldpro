import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

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
  ) {}

  async use(req: TenantRequest, res: Response, next: NextFunction) {
    // Public paths - no tenant required
    const publicPaths = ['/api/auth/login', '/api/auth/register', '/api/health', '/api/docs'];
    if (publicPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    let tenantSlug: string | undefined;

    // 1. Try subdomain
    const host = req.hostname;
    const parts = host.split('.');
    if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'api') {
      tenantSlug = parts[0];
    }

    // 2. Try header
    if (!tenantSlug && req.headers['x-tenant-slug']) {
      tenantSlug = req.headers['x-tenant-slug'] as string;
    }

    // 3. Try JWT token
    if (!tenantSlug) {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        try {
          const decoded = this.jwtService.decode(token) as any;
          if (decoded?.tenantSlug) {
            tenantSlug = decoded.tenantSlug;
          }
        } catch (error) {
          // ✅ FIXED: Log error but don't throw - auth guard will handle invalid tokens
          console.warn('Failed to decode JWT for tenant extraction:', (error as Error).message);
        }
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

      // ✅ Store in request for guards/decorators to use
      req.tenantId = tenant.id;
      req.tenantSlug = tenant.slug;
      req.tenantSchema = tenant.schema_name;
    }

    next();
  }
}

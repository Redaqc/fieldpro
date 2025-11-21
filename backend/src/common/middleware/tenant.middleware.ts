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

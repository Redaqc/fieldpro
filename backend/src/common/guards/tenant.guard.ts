import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { TenantPrismaService } from '../../prisma/tenant-prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private tenantPrisma: TenantPrismaService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (!request.tenantSchema) {
      throw new BadRequestException('Tenant context not found. Please provide tenant via header or subdomain.');
    }

    // ✅ FIXED: Set schema on the request-scoped service instance
    this.tenantPrisma.setTenantSchema(request.tenantSchema);

    return true;
  }
}

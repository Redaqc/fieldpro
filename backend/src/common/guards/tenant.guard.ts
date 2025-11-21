import { Injectable, CanActivate, ExecutionContext, BadRequestException, Logger } from '@nestjs/common';
import { TenantPrismaService } from '../../prisma/tenant-prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(private tenantPrisma: TenantPrismaService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (!request.tenantSchema) {
      this.logger.warn('Tenant context not found in request');
      throw new BadRequestException('Tenant context not found. Please provide tenant via header or subdomain.');
    }

    // ✅ SECURITY: setTenantSchema now validates schema format internally
    // Will throw UnauthorizedException if invalid
    try {
      this.tenantPrisma.setTenantSchema(request.tenantSchema);
      this.logger.debug(`Tenant schema set: ${request.tenantSchema}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to set tenant schema: ${err.message}`, err.stack);
      throw error;
    }

    return true;
  }
}

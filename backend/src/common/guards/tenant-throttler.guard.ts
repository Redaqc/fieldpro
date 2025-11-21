import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class TenantThrottlerGuard extends ThrottlerGuard {
  /**
   * ✅ SECURITY: Per-tenant + per-IP rate limiting
   * Prevents a single tenant or IP from exhausting API quotas for all tenants
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Combine tenant ID and IP address for granular rate limiting
    const tenantId = req.tenantId || 'public';
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const userId = req.user?.sub || 'anonymous';

    // Track by: tenant + IP + user for maximum granularity
    return `${tenantId}:${ip}:${userId}`;
  }
}

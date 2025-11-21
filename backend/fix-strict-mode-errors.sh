#!/bin/bash

# Fix app.module.ts REDIS_PORT parsing
sed -i "s/port: parseInt(process.env.REDIS_PORT) || 6379,/port: parseInt(process.env.REDIS_PORT || '6379'),/" /home/user/fieldpro/backend/src/app.module.ts

# Fix middleware error handling
sed -i "s/console.warn('Failed to decode JWT for tenant extraction:', error.message);/console.warn('Failed to decode JWT for tenant extraction:', (error as Error).message);/" /home/user/fieldpro/backend/src/common/middleware/tenant.middleware.ts

# Fix TenantPrismaService initialization
sed -i 's/private tenantSchema: string;/private tenantSchema!: string;/' /home/user/fieldpro/backend/src/prisma/tenant-prisma.service.ts

# Fix direction type in TenantPrismaService
sed -i 's/direction.toString/String(direction)/' /home/user/fieldpro/backend/src/prisma/tenant-prisma.service.ts

# Fix technicians service tech parameter
sed -i 's/technicians.map(async (tech) => {/technicians.map(async (tech: any) => {/' /home/user/fieldpro/backend/src/technicians/technicians.service.ts

echo "✅ Fixed strict mode type errors"

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { JobsModule } from './jobs/jobs.module';
import { ServiceCallsModule } from './service-calls/service-calls.module';
import { InvoicesModule } from './invoices/invoices.module';
import { QuotationsModule } from './quotations/quotations.module';
import { TechniciansModule } from './technicians/technicians.module';
import { MaterialsModule } from './materials/materials.module';
import { AssetsModule } from './assets/assets.module';
import { HealthModule } from './health/health.module';

import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),

    ScheduleModule.forRoot(),

    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),

    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 60000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),

    JwtModule.register({
      global: true,
      secret: (() => {
        const secret = process.env.JWT_SECRET;
        if (!secret || secret === 'your-super-secret-jwt-key-change-in-production') {
          if (process.env.NODE_ENV === 'production') {
            throw new Error('JWT_SECRET must be set to a strong secret in production');
          }
          console.warn('⚠️  WARNING: Using default JWT secret. Set JWT_SECRET in production!');
          return 'dev-secret-only-for-development';
        }
        if (secret.length < 32) {
          throw new Error('JWT_SECRET must be at least 32 characters long');
        }
        return secret;
      })(),
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
    }),

    PrismaModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    CustomersModule,
    JobsModule,
    ServiceCallsModule,
    InvoicesModule,
    QuotationsModule,
    TechniciansModule,
    MaterialsModule,
    AssetsModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware, TenantMiddleware)
      .forRoutes('*');
  }
}

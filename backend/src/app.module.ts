import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { JobsModule } from './jobs/jobs.module';
import { TechniciansModule } from './technicians/technicians.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { ServiceCallsModule } from './service-calls/service-calls.module';
import { MaterialsModule } from './materials/materials.module';
import { TimeEntriesModule } from './time-entries/time-entries.module';
import { AssetsModule } from './assets/assets.module';
import { QuotationsModule } from './quotations/quotations.module';
import { WorkTypesModule } from './work-types/work-types.module';
import { RecurringJobsModule } from './recurring-jobs/recurring-jobs.module';
import { SupplierInvoicesModule } from './supplier-invoices/supplier-invoices.module';
import { PriceListsModule } from './price-lists/price-lists.module';
import { BundlesModule } from './bundles/bundles.module';
import { MaintenanceSchedulesModule } from './maintenance-schedules/maintenance-schedules.module';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 10, // 10 requests per TTL
      },
    ]),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    CustomersModule,
    JobsModule,
    TechniciansModule,
    InvoicesModule,
    PaymentsModule,
    ServiceCallsModule,
    MaterialsModule,
    TimeEntriesModule,
    AssetsModule,
    QuotationsModule,
    WorkTypesModule,
    RecurringJobsModule,
    SupplierInvoicesModule,
    PriceListsModule,
    BundlesModule,
    MaintenanceSchedulesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

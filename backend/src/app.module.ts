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
import { GPSTrackingModule } from './gps-tracking/gps-tracking.module';
import { GPSZonesModule } from './gps-zones/gps-zones.module';
import { GPSAlertsModule } from './gps-alerts/gps-alerts.module';
import { FormTemplatesModule } from './form-templates/form-templates.module';
import { FormSubmissionsModule } from './form-submissions/form-submissions.module';
import { FormAutomationsModule } from './form-automations/form-automations.module';
import { AutomationsModule } from './automations/automations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { NotificationPreferencesModule } from './notification-preferences/notification-preferences.module';
import { NotificationTemplatesModule } from './notification-templates/notification-templates.module';
import { PushSubscriptionsModule } from './push-subscriptions/push-subscriptions.module';
import { AlertsModule } from './alerts/alerts.module';
import { ProfitabilityRecordsModule } from './profitability-records/profitability-records.module';
import { DocumentsModule } from './documents/documents.module';
import { CustomerFeedbackModule } from './customer-feedback/customer-feedback.module';

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
    GPSTrackingModule,
    GPSZonesModule,
    GPSAlertsModule,
    FormTemplatesModule,
    FormSubmissionsModule,
    FormAutomationsModule,
    AutomationsModule,
    NotificationsModule,
    NotificationPreferencesModule,
    NotificationTemplatesModule,
    PushSubscriptionsModule,
    AlertsModule,
    ProfitabilityRecordsModule,
    DocumentsModule,
    CustomerFeedbackModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

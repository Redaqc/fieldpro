import { Module } from '@nestjs/common';
import { DashboardConfigService } from './dashboard-config.service';
import { DashboardConfigController } from './dashboard-config.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardConfigController],
  providers: [DashboardConfigService],
  exports: [DashboardConfigService],
})
export class DashboardConfigModule {}

import { Module } from '@nestjs/common';
import { MaintenanceSchedulesService } from './maintenance-schedules.service';
import { MaintenanceSchedulesController } from './maintenance-schedules.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MaintenanceSchedulesController],
  providers: [MaintenanceSchedulesService],
  exports: [MaintenanceSchedulesService],
})
export class MaintenanceSchedulesModule {}

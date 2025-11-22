import { Module } from '@nestjs/common';
import { GPSAlertsService } from './gps-alerts.service';
import { GPSAlertsController } from './gps-alerts.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GPSAlertsController],
  providers: [GPSAlertsService],
  exports: [GPSAlertsService],
})
export class GPSAlertsModule {}

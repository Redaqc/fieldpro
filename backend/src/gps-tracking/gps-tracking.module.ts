import { Module } from '@nestjs/common';
import { GPSTrackingService } from './gps-tracking.service';
import { GPSTrackingController } from './gps-tracking.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GPSTrackingController],
  providers: [GPSTrackingService],
  exports: [GPSTrackingService],
})
export class GPSTrackingModule {}

import { Module } from '@nestjs/common';
import { GPSZonesService } from './gps-zones.service';
import { GPSZonesController } from './gps-zones.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GPSZonesController],
  providers: [GPSZonesService],
  exports: [GPSZonesService],
})
export class GPSZonesModule {}

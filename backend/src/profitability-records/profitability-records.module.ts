import { Module } from '@nestjs/common';
import { ProfitabilityRecordsService } from './profitability-records.service';
import { ProfitabilityRecordsController } from './profitability-records.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProfitabilityRecordsController],
  providers: [ProfitabilityRecordsService],
  exports: [ProfitabilityRecordsService],
})
export class ProfitabilityRecordsModule {}

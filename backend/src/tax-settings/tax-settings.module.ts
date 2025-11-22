import { Module } from '@nestjs/common';
import { TaxSettingsService } from './tax-settings.service';
import { TaxSettingsController } from './tax-settings.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TaxSettingsController],
  providers: [TaxSettingsService],
  exports: [TaxSettingsService],
})
export class TaxSettingsModule {}

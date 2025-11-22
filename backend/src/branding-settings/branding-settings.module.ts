import { Module } from '@nestjs/common';
import { BrandingSettingsService } from './branding-settings.service';
import { BrandingSettingsController } from './branding-settings.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BrandingSettingsController],
  providers: [BrandingSettingsService],
  exports: [BrandingSettingsService],
})
export class BrandingSettingsModule {}

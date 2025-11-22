import { Module } from '@nestjs/common';
import { IntegrationSettingsService } from './integration-settings.service';
import { IntegrationSettingsController } from './integration-settings.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IntegrationSettingsController],
  providers: [IntegrationSettingsService],
  exports: [IntegrationSettingsService],
})
export class IntegrationSettingsModule {}

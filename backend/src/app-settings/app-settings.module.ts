import { Module } from '@nestjs/common';
import { AppSettingsService } from './app-settings.service';
import { AppSettingsController } from './app-settings.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppSettingsController],
  providers: [AppSettingsService],
  exports: [AppSettingsService],
})
export class AppSettingsModule {}

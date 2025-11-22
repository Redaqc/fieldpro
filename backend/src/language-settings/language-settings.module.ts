import { Module } from '@nestjs/common';
import { LanguageSettingsService } from './language-settings.service';
import { LanguageSettingsController } from './language-settings.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LanguageSettingsController],
  providers: [LanguageSettingsService],
  exports: [LanguageSettingsService],
})
export class LanguageSettingsModule {}

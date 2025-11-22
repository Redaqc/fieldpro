import { Module } from '@nestjs/common';
import { FormAutomationsService } from './form-automations.service';
import { FormAutomationsController } from './form-automations.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FormAutomationsController],
  providers: [FormAutomationsService],
  exports: [FormAutomationsService],
})
export class FormAutomationsModule {}

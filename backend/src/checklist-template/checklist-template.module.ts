import { Module } from '@nestjs/common';
import { ChecklistTemplateService } from './checklist-template.service';
import { ChecklistTemplateController } from './checklist-template.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChecklistTemplateController],
  providers: [ChecklistTemplateService],
  exports: [ChecklistTemplateService],
})
export class ChecklistTemplateModule {}

import { Module } from '@nestjs/common';
import { CustomFieldService } from './custom-field.service';
import { CustomFieldController } from './custom-field.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustomFieldController],
  providers: [CustomFieldService],
  exports: [CustomFieldService],
})
export class CustomFieldModule {}

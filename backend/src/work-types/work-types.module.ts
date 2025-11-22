import { Module } from '@nestjs/common';
import { WorkTypesService } from './work-types.service';
import { WorkTypesController } from './work-types.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WorkTypesController],
  providers: [WorkTypesService],
  exports: [WorkTypesService],
})
export class WorkTypesModule {}

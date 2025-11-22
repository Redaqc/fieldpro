import { Module } from '@nestjs/common';
import { RecurringJobsService } from './recurring-jobs.service';
import { RecurringJobsController } from './recurring-jobs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RecurringJobsController],
  providers: [RecurringJobsService],
  exports: [RecurringJobsService],
})
export class RecurringJobsModule {}

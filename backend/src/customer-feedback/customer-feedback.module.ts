import { Module } from '@nestjs/common';
import { CustomerFeedbackService } from './customer-feedback.service';
import { CustomerFeedbackController } from './customer-feedback.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustomerFeedbackController],
  providers: [CustomerFeedbackService],
  exports: [CustomerFeedbackService],
})
export class CustomerFeedbackModule {}

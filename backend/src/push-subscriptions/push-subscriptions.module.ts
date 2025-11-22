import { Module } from '@nestjs/common';
import { PushSubscriptionsService } from './push-subscriptions.service';
import { PushSubscriptionsController } from './push-subscriptions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PushSubscriptionsController],
  providers: [PushSubscriptionsService],
  exports: [PushSubscriptionsService],
})
export class PushSubscriptionsModule {}

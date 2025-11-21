import { Module } from '@nestjs/common';
import { ServiceCallsService } from './service-calls.service';
import { ServiceCallsController } from './service-calls.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceCallsController],
  providers: [ServiceCallsService],
  exports: [ServiceCallsService],
})
export class ServiceCallsModule {}

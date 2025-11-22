import { Module } from '@nestjs/common';
import { TeamMessageService } from './team-message.service';
import { TeamMessageController } from './team-message.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TeamMessageController],
  providers: [TeamMessageService],
  exports: [TeamMessageService],
})
export class TeamMessageModule {}

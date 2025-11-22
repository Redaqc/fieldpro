import { PartialType } from '@nestjs/swagger';
import { CreateNotificationDto } from './create-notification.dto';
import { IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationDto extends PartialType(CreateNotificationDto) {
  @ApiPropertyOptional({ description: 'Mark notification as read' })
  @IsOptional()
  @IsBoolean()
  is_read?: boolean;

  @ApiPropertyOptional({ description: 'Mark when notification was read' })
  @IsOptional()
  @IsDateString()
  read_at?: string;

  @ApiPropertyOptional({ description: 'Mark when notification was sent' })
  @IsOptional()
  @IsDateString()
  sent_at?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty() @IsString() @IsNotEmpty() userId: string;
  @ApiProperty() @IsString() @IsNotEmpty() title: string;
  @ApiProperty() @IsString() @IsNotEmpty() message: string;
  @ApiProperty({ enum: NotificationType }) @IsEnum(NotificationType) type: NotificationType;
  @ApiPropertyOptional({ default: false }) @IsBoolean() @IsOptional() read?: boolean;
  @ApiPropertyOptional() @IsString() @IsOptional() actionUrl?: string;
}

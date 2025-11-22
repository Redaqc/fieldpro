import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class CreateAlertDto {
  @ApiProperty({ enum: NotificationType }) @IsEnum(NotificationType) type: NotificationType;
  @ApiProperty() @IsString() @IsNotEmpty() message: string;
  @ApiProperty() @IsString() @IsNotEmpty() userId: string;
  @ApiPropertyOptional({ default: false }) @IsBoolean() @IsOptional() read?: boolean;
}

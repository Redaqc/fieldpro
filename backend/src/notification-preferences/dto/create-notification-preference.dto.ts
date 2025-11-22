import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsObject } from 'class-validator';

export class CreateNotificationPreferenceDto {
  @ApiProperty() @IsString() @IsNotEmpty() userId: string;
  @ApiPropertyOptional({ default: true }) @IsBoolean() @IsOptional() emailNotifications?: boolean;
  @ApiPropertyOptional({ default: true }) @IsBoolean() @IsOptional() pushNotifications?: boolean;
  @ApiPropertyOptional({ default: false }) @IsBoolean() @IsOptional() smsNotifications?: boolean;
  @ApiPropertyOptional() @IsObject() @IsOptional() notificationTypes?: any;
}

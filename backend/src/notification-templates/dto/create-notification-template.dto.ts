import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsObject } from 'class-validator';

export class CreateNotificationTemplateDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty() @IsString() @IsNotEmpty() type: string;
  @ApiPropertyOptional() @IsString() @IsOptional() subject?: string;
  @ApiProperty() @IsString() @IsNotEmpty() body: string;
  @ApiPropertyOptional() @IsObject() @IsOptional() variables?: any;
  @ApiPropertyOptional({ default: true }) @IsBoolean() @IsOptional() active?: boolean;
}

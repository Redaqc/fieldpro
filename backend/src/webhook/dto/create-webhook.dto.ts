import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsObject } from 'class-validator';

export class CreateWebhookDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty() @IsString() @IsNotEmpty() url: string;
  @ApiProperty() @IsString() @IsNotEmpty() eventType: string;
  @ApiPropertyOptional() @IsObject() @IsOptional() headers?: any;
  @ApiPropertyOptional() @IsString() @IsOptional() secret?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() active?: boolean;
}

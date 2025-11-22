import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateLanguageSettingsDto {
  @ApiPropertyOptional() @IsString() @IsOptional() userId?: string;
  @ApiProperty() @IsString() @IsNotEmpty() language: string;
}

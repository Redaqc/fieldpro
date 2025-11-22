import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateTaxSettingsDto {
  @ApiProperty() @IsString() @IsNotEmpty() taxName: string;
  @ApiProperty() @IsNumber() taxRate: number;
  @ApiPropertyOptional() @IsString() @IsOptional() province?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() country?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() active?: boolean;
}

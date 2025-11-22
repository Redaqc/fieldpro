import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject, IsDateString } from 'class-validator';
import { IntegrationType } from '@prisma/client';

export class CreateIntegrationDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty({ enum: IntegrationType }) @IsEnum(IntegrationType) type: IntegrationType;
  @ApiPropertyOptional() @IsString() @IsOptional() status?: string;
  @ApiPropertyOptional() @IsObject() @IsOptional() config?: any;
  @ApiPropertyOptional() @IsDateString() @IsOptional() lastSync?: string;
}

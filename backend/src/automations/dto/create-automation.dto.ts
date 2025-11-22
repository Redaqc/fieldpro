import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateAutomationDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiProperty() @IsString() @IsNotEmpty() triggerType: string;
  @ApiProperty() @IsObject() triggerConditions: any;
  @ApiProperty() @IsObject() actions: any;
  @ApiPropertyOptional({ default: true }) @IsBoolean() @IsOptional() active?: boolean;
}

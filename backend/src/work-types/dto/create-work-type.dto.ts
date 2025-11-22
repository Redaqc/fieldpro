import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkTypeDto {
  @ApiProperty({ description: 'Work type name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Work type description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Work type category' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ description: 'Default hourly rate' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  default_hourly_rate?: number;

  @ApiPropertyOptional({ description: 'Default duration in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  default_duration_minutes?: number;

  @ApiPropertyOptional({ description: 'Color code for calendar/display' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @ApiPropertyOptional({ description: 'Is work type active', default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Require customer signature', default: false })
  @IsOptional()
  @IsBoolean()
  require_signature?: boolean;

  @ApiPropertyOptional({ description: 'Require photo evidence', default: false })
  @IsOptional()
  @IsBoolean()
  require_photo?: boolean;
}

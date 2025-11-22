import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';

export class CreateWorkTypeDto {
  @ApiProperty({ description: 'Work type name (unique)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Work type description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Default duration in minutes' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  defaultDuration?: number;

  @ApiPropertyOptional({ description: 'Default price' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  defaultPrice?: number;

  @ApiPropertyOptional({ description: 'Color code (hex)' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'French label' })
  @IsString()
  @IsOptional()
  labelFr?: string;

  @ApiPropertyOptional({ description: 'Active status', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

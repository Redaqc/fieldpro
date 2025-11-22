import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
} from 'class-validator';
import { RecurringFrequency } from '@prisma/client';

export class CreateRecurringJobDto {
  @ApiPropertyOptional({ description: 'Job template ID (optional)' })
  @IsString()
  @IsOptional()
  jobTemplateId?: string;

  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({
    description: 'Recurrence frequency',
    enum: RecurringFrequency,
  })
  @IsEnum(RecurringFrequency)
  @IsNotEmpty()
  frequency: RecurringFrequency;

  @ApiPropertyOptional({
    description: 'Frequency value (e.g., every 2 weeks)',
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  frequencyValue?: number;

  @ApiProperty({ description: 'Start date (ISO string)' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiPropertyOptional({ description: 'End date (ISO string, optional)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Next occurrence date (ISO string, auto-calculated if not provided)',
  })
  @IsDateString()
  @IsOptional()
  nextOccurrence?: string;

  @ApiPropertyOptional({
    description: 'Assigned technician IDs (JSON array)',
    type: [String],
  })
  @IsArray()
  @IsOptional()
  assignedTechnicians?: string[];

  @ApiPropertyOptional({
    description: 'Auto-assign technicians to generated jobs',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  autoAssign?: boolean;

  @ApiPropertyOptional({ description: 'Active status', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateTimeEntryDto {
  @ApiProperty({ example: 'uuid-technician-id' })
  @IsUUID()
  technicianId: string;

  @ApiProperty({ example: 'uuid-job-id', required: false })
  @IsOptional()
  @IsUUID()
  jobId?: string;

  @ApiProperty({ example: '2025-11-22T08:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2025-11-22T12:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiProperty({ example: 4.0, required: false, description: 'Duration in hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationHours?: number;

  @ApiProperty({ example: 'HVAC repair work', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  billable?: boolean;

  @ApiProperty({ example: 75.00, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiProperty({ example: 300.00, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalCost?: number;
}

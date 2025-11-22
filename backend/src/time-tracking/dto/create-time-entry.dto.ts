import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsDateString, IsEnum, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TimeEntryType {
  JOB = 'job',
  SERVICE_CALL = 'service_call',
  GENERAL = 'general',
  TRAVEL = 'travel',
  BREAK = 'break',
}

export class CreateTimeEntryDto {
  @ApiProperty({ description: 'Technician or user ID' })
  @IsNotEmpty()
  @IsUUID()
  user_id!: string;

  @ApiProperty({ enum: TimeEntryType, description: 'Type of time entry' })
  @IsNotEmpty()
  @IsEnum(TimeEntryType)
  type!: TimeEntryType;

  @ApiProperty({ description: 'Start time' })
  @IsNotEmpty()
  @IsDateString()
  start_time!: string;

  @ApiPropertyOptional({ description: 'End time (null if still in progress)' })
  @IsOptional()
  @IsDateString()
  end_time?: string;

  @ApiPropertyOptional({ description: 'Related job ID' })
  @IsOptional()
  @IsUUID()
  job_id?: string;

  @ApiPropertyOptional({ description: 'Related service call ID' })
  @IsOptional()
  @IsUUID()
  service_call_id?: string;

  @ApiPropertyOptional({ description: 'Description of work performed' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Is this time billable to customer', default: true })
  @IsOptional()
  @IsBoolean()
  is_billable?: boolean;

  @ApiPropertyOptional({ description: 'Hourly rate for this entry' })
  @IsOptional()
  hourly_rate?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

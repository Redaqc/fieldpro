import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNumber,
  IsArray,
} from 'class-validator';
import { JobStatus, JobPriority } from '@prisma/client';

export class CreateJobDto {
  @ApiProperty({ example: 'JOB-2025-001', required: false })
  @IsOptional()
  @IsString()
  jobNumber?: string;

  @ApiProperty({ example: 'uuid-customer-id' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: 'Repair HVAC system' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Customer reports no cooling', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: JobStatus, default: JobStatus.PENDING })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiProperty({ enum: JobPriority, default: JobPriority.MEDIUM })
  @IsOptional()
  @IsEnum(JobPriority)
  priority?: JobPriority;

  @ApiProperty({ example: '2025-11-22T10:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  scheduledStart?: string;

  @ApiProperty({ example: '2025-11-22T12:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  scheduledEnd?: string;

  @ApiProperty({ example: 2.5, description: 'Duration in hours', required: false })
  @IsOptional()
  @IsNumber()
  estimatedDuration?: number;

  @ApiProperty({ example: ['tech-uuid-1', 'tech-uuid-2'], required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  technicianIds?: string[];

  @ApiProperty({ example: '123 Service St, NY', required: false })
  @IsOptional()
  @IsString()
  serviceAddress?: string;

  @ApiProperty({ example: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

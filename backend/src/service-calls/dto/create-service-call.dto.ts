import { IsNotEmpty, IsString, IsOptional, IsDateString, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ServiceCallPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ServiceCallStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class CreateServiceCallDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  customer_id!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  job_id?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255, { message: 'Title cannot exceed 255 characters' })
  title!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Description cannot exceed 5000 characters' })
  description?: string;

  @ApiProperty({ enum: ServiceCallPriority, default: ServiceCallPriority.MEDIUM })
  @IsOptional()
  @IsEnum(ServiceCallPriority)
  priority?: ServiceCallPriority;

  @ApiProperty({ enum: ServiceCallStatus, default: ServiceCallStatus.PENDING })
  @IsOptional()
  @IsEnum(ServiceCallStatus)
  status?: ServiceCallStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  scheduled_date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assigned_to?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  location?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  custom_fields?: any;
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ServiceCallStatus, JobPriority } from '@prisma/client';

export class CreateServiceCallDto {
  @ApiProperty({ example: 'SC-2025-001', required: false })
  @IsOptional()
  @IsString()
  callNumber?: string;

  @ApiProperty({ example: 'uuid-customer-id' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: 'HVAC System Not Working' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Customer reports no cooling', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: JobPriority, default: JobPriority.MEDIUM })
  @IsOptional()
  @IsEnum(JobPriority)
  priority?: JobPriority;

  @ApiProperty({ enum: ServiceCallStatus, default: ServiceCallStatus.OPEN })
  @IsOptional()
  @IsEnum(ServiceCallStatus)
  status?: ServiceCallStatus;

  @ApiProperty({ example: 'uuid-technician-id', required: false })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @ApiProperty({ example: '2025-11-22T10:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;
}

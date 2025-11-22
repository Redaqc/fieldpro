import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class CreateMaintenanceScheduleDto {
  @ApiProperty({ description: 'Asset ID' })
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @ApiProperty({ description: 'Maintenance type' })
  @IsString()
  @IsNotEmpty()
  maintenanceType: string;

  @ApiProperty({ description: 'Schedule type' })
  @IsString()
  @IsNotEmpty()
  scheduleType: string;

  @ApiPropertyOptional({ description: 'Frequency (e.g., monthly, quarterly)' })
  @IsString()
  @IsOptional()
  frequency?: string;

  @ApiProperty({ description: 'Next maintenance date (ISO string)' })
  @IsDateString()
  @IsNotEmpty()
  nextMaintenanceDate: string;

  @ApiPropertyOptional({ description: 'Last maintenance date (ISO string)' })
  @IsDateString()
  @IsOptional()
  lastMaintenanceDate?: string;

  @ApiPropertyOptional({ description: 'Assigned technician ID' })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Active status', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

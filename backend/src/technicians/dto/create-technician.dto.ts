import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsObject, IsBoolean, IsArray, IsString } from 'class-validator';

export class WorkingHoursDto {
  @ApiProperty({ example: 8, description: 'Start hour (0-23)' })
  start: number;

  @ApiProperty({ example: 17, description: 'End hour (0-23)' })
  end: number;

  @ApiProperty({ example: [1, 2, 3, 4, 5], description: 'Working days (0=Sunday, 6=Saturday)' })
  days: number[];
}

export class CreateTechnicianDto {
  @ApiProperty({ example: 'uuid-user-id', description: 'User ID to link to technician' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'HVAC-CERT-123', required: false })
  @IsOptional()
  @IsString()
  certificationNumber?: string;

  @ApiProperty({ example: ['HVAC', 'Electrical'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiProperty({
    type: WorkingHoursDto,
    required: false,
    example: { start: 8, end: 17, days: [1, 2, 3, 4, 5] }
  })
  @IsOptional()
  @IsObject()
  workingHours?: WorkingHoursDto;

  @ApiProperty({ example: 40.7128, required: false })
  @IsOptional()
  currentLatitude?: number;

  @ApiProperty({ example: -74.0060, required: false })
  @IsOptional()
  currentLongitude?: number;

  @ApiProperty({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

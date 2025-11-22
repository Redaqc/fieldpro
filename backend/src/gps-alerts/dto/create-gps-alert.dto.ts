import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { AlertType } from '@prisma/client';

export class CreateGPSAlertDto {
  @ApiProperty({ description: 'Technician ID' })
  @IsString()
  @IsNotEmpty()
  technicianId: string;

  @ApiPropertyOptional({ description: 'GPS Zone ID (if related to geofencing)' })
  @IsString()
  @IsOptional()
  zoneId?: string;

  @ApiProperty({ description: 'Alert type', enum: AlertType })
  @IsEnum(AlertType)
  @IsNotEmpty()
  alertType: AlertType;

  @ApiProperty({ description: 'Alert message' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'Acknowledged status', default: false })
  @IsBoolean()
  @IsOptional()
  acknowledged?: boolean;
}

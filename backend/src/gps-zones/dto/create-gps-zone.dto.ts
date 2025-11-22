import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
} from 'class-validator';

export class CreateGPSZoneDto {
  @ApiProperty({ description: 'Zone name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Zone description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Zone type (e.g., customer_site, office, restricted)' })
  @IsString()
  @IsNotEmpty()
  zoneType: string;

  @ApiProperty({ description: 'GeoJSON polygon coordinates' })
  @IsObject()
  coordinates: any;

  @ApiPropertyOptional({ description: 'Radius in meters (for circular zones)' })
  @IsNumber()
  @IsOptional()
  radius?: number;

  @ApiPropertyOptional({ description: 'Active status', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

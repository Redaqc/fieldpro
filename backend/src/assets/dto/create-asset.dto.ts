import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { AssetStatus } from '@prisma/client';

export class CreateAssetDto {
  @ApiProperty({ example: 'ASSET-2025-001', required: false })
  @IsOptional()
  @IsString()
  assetNumber?: string;

  @ApiProperty({ example: 'Generator XL-2000' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Honda', required: false })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ example: 'EU2200i', required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ example: 'SN-123456789', required: false })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiProperty({ example: '2024-01-15T00:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiProperty({ example: '2027-01-15T00:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  warrantyExpiry?: string;

  @ApiProperty({ enum: AssetStatus, default: AssetStatus.ACTIVE })
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @ApiProperty({ example: 'Warehouse A', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: 'uuid-technician-id', required: false })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;
}

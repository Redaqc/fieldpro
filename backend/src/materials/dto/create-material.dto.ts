import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, IsInt } from 'class-validator';

export class CreateMaterialDto {
  @ApiProperty({ example: 'HVAC Filter 16x25x1' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'SKU-HVAC-001', required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: 'High-efficiency air filter', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 25.50 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ example: 100, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantityOnHand?: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  minStockLevel?: number;

  @ApiProperty({ example: 'each', required: false })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: 'HVAC Suppliers Inc.', required: false })
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiProperty({ example: 'Filters', required: false })
  @IsOptional()
  @IsString()
  category?: string;
}

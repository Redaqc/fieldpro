import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BundleItemDto {
  @ApiProperty({ description: 'Item type (service/material)' })
  @IsNotEmpty()
  @IsString()
  type!: string;

  @ApiProperty({ description: 'Item ID (service_id or material_id)' })
  @IsNotEmpty()
  @IsString()
  item_id!: string;

  @ApiProperty({ description: 'Quantity' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ description: 'Item name (for display)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Unit price' })
  @IsOptional()
  @IsNumber()
  price?: number;
}

export class CreateBundleDto {
  @ApiProperty({ description: 'Bundle name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Bundle description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ description: 'Bundle items', type: [BundleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BundleItemDto)
  items!: BundleItemDto[];

  @ApiProperty({ description: 'Bundle price' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ description: 'Bundle category' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ description: 'Is bundle active', default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Discount percentage compared to individual items' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_percent?: number;
}

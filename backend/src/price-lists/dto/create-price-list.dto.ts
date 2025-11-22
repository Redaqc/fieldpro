import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, MaxLength, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PriceListItemDto {
  @ApiProperty({ description: 'Item type (service/material/bundle)' })
  @IsNotEmpty()
  @IsString()
  type!: string;

  @ApiProperty({ description: 'Item ID' })
  @IsNotEmpty()
  @IsString()
  item_id!: string;

  @ApiProperty({ description: 'Price for this item' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ description: 'Item name (for display)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Item unit' })
  @IsOptional()
  @IsString()
  unit?: string;
}

export class CreatePriceListDto {
  @ApiProperty({ description: 'Price list name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Price list description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ description: 'Price list items', type: [PriceListItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceListItemDto)
  items!: PriceListItemDto[];

  @ApiPropertyOptional({ description: 'Effective from date' })
  @IsOptional()
  @IsDateString()
  effective_from?: string;

  @ApiPropertyOptional({ description: 'Effective until date' })
  @IsOptional()
  @IsDateString()
  effective_until?: string;

  @ApiPropertyOptional({ description: 'Is price list active', default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Is this the default price list', default: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

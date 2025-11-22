import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsArray, ValidateNested, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ChecklistItemDto {
  @ApiProperty({ description: 'Item ID' })
  @IsNotEmpty()
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Item text/question' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  text!: string;

  @ApiPropertyOptional({ description: 'Is this item required', default: true })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ description: 'Item order' })
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ description: 'Allow notes/comments', default: false })
  @IsOptional()
  @IsBoolean()
  allow_notes?: boolean;

  @ApiPropertyOptional({ description: 'Require photo evidence', default: false })
  @IsOptional()
  @IsBoolean()
  require_photo?: boolean;
}

export class CreateChecklistDto {
  @ApiProperty({ description: 'Checklist name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Checklist description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ description: 'Checklist category' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  category!: string;

  @ApiProperty({ description: 'Checklist items', type: [ChecklistItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  items!: ChecklistItemDto[];

  @ApiPropertyOptional({ description: 'Is checklist active', default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

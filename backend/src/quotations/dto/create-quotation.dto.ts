import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsArray,
  IsNumber,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class QuotationLineItemDto {
  @ApiProperty({ description: 'Description of the line item' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Unit price' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Tax rate (percentage)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  taxRate?: number;

  @ApiProperty({ description: 'Line total (auto-calculated if not provided)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  total?: number;
}

export class CreateQuotationDto {
  @ApiPropertyOptional({ description: 'Quote number (auto-generated if not provided)' })
  @IsString()
  @IsOptional()
  quoteNumber?: string;

  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ description: 'Quotation title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Quotation description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Issue date (ISO string)' })
  @IsDateString()
  @IsNotEmpty()
  issueDate: string;

  @ApiProperty({ description: 'Expiry date (ISO string)' })
  @IsDateString()
  @IsNotEmpty()
  expiryDate: string;

  @ApiProperty({ description: 'Line items', type: [QuotationLineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationLineItemDto)
  lineItems: QuotationLineItemDto[];

  @ApiPropertyOptional({ description: 'Subtotal (auto-calculated if not provided)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  subtotal?: number;

  @ApiPropertyOptional({ description: 'Tax (auto-calculated if not provided)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  tax?: number;

  @ApiPropertyOptional({ description: 'Total (auto-calculated if not provided)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  total?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

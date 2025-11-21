import { IsNotEmpty, IsString, IsOptional, IsNumber, IsDateString, IsEnum, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum QuotationStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

export class QuotationLineItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  unit_price: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  tax_rate?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  item_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  item_type?: string;
}

export class CreateQuotationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  customer_id: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  job_id?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsArray()
  line_items: QuotationLineItemDto[];

  @ApiProperty({ enum: QuotationStatus, default: QuotationStatus.DRAFT })
  @IsOptional()
  @IsEnum(QuotationStatus)
  status?: QuotationStatus;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  issue_date: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  valid_until: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  discount_amount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  discount_percentage?: number;
}

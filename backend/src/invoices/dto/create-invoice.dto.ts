import { IsNotEmpty, IsString, IsOptional, IsNumber, IsDateString, IsEnum, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export class InvoiceLineItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  unit_price!: number;

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

export class CreateInvoiceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  customer_id!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  job_id?: string;

  @ApiProperty()
  @IsArray()
  line_items!: InvoiceLineItemDto[];

  @ApiProperty({ enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  issue_date!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  due_date!: string;

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

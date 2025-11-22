import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';

export class InvoiceLineItemDto {
  @ApiProperty({ example: 'Repair Service' })
  @IsString()
  description: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ example: 150.00 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ example: 300.00 })
  @IsNumber()
  @Min(0)
  total: number;

  @ApiProperty({ example: 'uuid-material-id', required: false })
  @IsOptional()
  @IsUUID()
  materialId?: string;
}

export class CreateInvoiceDto {
  @ApiProperty({ example: 'INV-2025-001', required: false })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiProperty({ example: 'uuid-customer-id' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: 'uuid-job-id', required: false })
  @IsOptional()
  @IsUUID()
  jobId?: string;

  @ApiProperty({ enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiProperty({ example: '2025-11-22T00:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @ApiProperty({ example: '2025-12-22T00:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ type: [InvoiceLineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  lineItems: InvoiceLineItemDto[];

  @ApiProperty({ example: 300.00 })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({ example: 13, description: 'Tax percentage', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @ApiProperty({ example: 39.00, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @ApiProperty({ example: 339.00 })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty({ example: 'Payment due within 30 days', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'NET30', required: false })
  @IsOptional()
  @IsString()
  paymentTerms?: string;
}

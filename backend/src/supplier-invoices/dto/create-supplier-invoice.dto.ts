import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateSupplierInvoiceDto {
  @ApiProperty({ description: 'Supplier name' })
  @IsString()
  @IsNotEmpty()
  supplierName: string;

  @ApiProperty({ description: 'Invoice number' })
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @ApiProperty({ description: 'Invoice date (ISO string)' })
  @IsDateString()
  @IsNotEmpty()
  invoiceDate: string;

  @ApiProperty({ description: 'Due date (ISO string)' })
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @ApiProperty({ description: 'Invoice amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Paid amount', default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  paidAmount?: number;

  @ApiPropertyOptional({ description: 'Payment status', default: 'pending' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Invoice category' })
  @IsString()
  @IsOptional()
  category?: string;
}

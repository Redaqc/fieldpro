import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum, IsOptional, IsDateString, IsNumber, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ example: 'uuid-invoice-id' })
  @IsUUID()
  invoiceId: string;

  @ApiProperty({ example: 150.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CREDIT_CARD })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: '2025-11-22T10:30:00Z', required: false })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiProperty({ example: 'txn_123456789', required: false })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({ example: 'Payment via Stripe', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

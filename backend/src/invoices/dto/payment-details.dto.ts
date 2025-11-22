import { IsOptional, IsNumber, IsString, Min, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentDetailsDto {
  @ApiPropertyOptional({ description: 'Payment amount (defaults to invoice total)' })
  @IsOptional()
  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount?: number;

  @ApiPropertyOptional({ description: 'Payment method', example: 'manual' })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Payment method cannot exceed 50 characters' })
  method?: string;

  @ApiPropertyOptional({ description: 'Payment notes' })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Notes cannot exceed 1000 characters' })
  notes?: string;
}

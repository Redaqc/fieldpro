import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateProfitabilityRecordDto {
  @ApiProperty({ description: 'Job ID' })
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @ApiProperty({ description: 'Revenue' })
  @IsNumber()
  @Min(0)
  revenue: number;

  @ApiProperty({ description: 'Labor cost' })
  @IsNumber()
  @Min(0)
  laborCost: number;

  @ApiProperty({ description: 'Material cost' })
  @IsNumber()
  @Min(0)
  materialCost: number;

  @ApiProperty({ description: 'Overhead cost' })
  @IsNumber()
  @Min(0)
  overheadCost: number;

  @ApiProperty({ description: 'Total cost' })
  @IsNumber()
  @Min(0)
  totalCost: number;

  @ApiProperty({ description: 'Profit' })
  @IsNumber()
  profit: number;

  @ApiProperty({ description: 'Profit margin (percentage)' })
  @IsNumber()
  profitMargin: number;
}

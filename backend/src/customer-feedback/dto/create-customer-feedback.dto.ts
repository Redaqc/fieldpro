import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateCustomerFeedbackDto {
  @ApiProperty() @IsString() @IsNotEmpty() customerId: string;
  @ApiPropertyOptional() @IsString() @IsOptional() jobId?: string;
  @ApiProperty() @IsInt() @Min(1) @Max(5) rating: number;
  @ApiPropertyOptional() @IsString() @IsOptional() comments?: string;
}

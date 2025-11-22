import { IsNotEmpty, IsString, IsOptional, IsUUID, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFormSubmissionDto {
  @ApiProperty({ description: 'Form ID' })
  @IsNotEmpty()
  @IsUUID()
  form_id!: string;

  @ApiProperty({ description: 'User ID who submitted the form' })
  @IsNotEmpty()
  @IsUUID()
  submitted_by!: string;

  @ApiProperty({ description: 'Form field responses' })
  @IsNotEmpty()
  @IsObject()
  responses!: Record<string, any>;

  @ApiPropertyOptional({ description: 'Signature data (base64)' })
  @IsOptional()
  @IsString()
  signature?: string;

  @ApiPropertyOptional({ description: 'Related job ID' })
  @IsOptional()
  @IsUUID()
  job_id?: string;

  @ApiPropertyOptional({ description: 'Related service call ID' })
  @IsOptional()
  @IsUUID()
  service_call_id?: string;

  @ApiPropertyOptional({ description: 'Related customer ID' })
  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

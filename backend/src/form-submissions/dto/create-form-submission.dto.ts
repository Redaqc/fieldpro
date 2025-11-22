import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateFormSubmissionDto {
  @ApiProperty({ description: 'Form template ID' })
  @IsString()
  @IsNotEmpty()
  formTemplateId: string;

  @ApiProperty({ description: 'Submitted by user ID' })
  @IsString()
  @IsNotEmpty()
  submittedBy: string;

  @ApiPropertyOptional({ description: 'Related job ID' })
  @IsString()
  @IsOptional()
  jobId?: string;

  @ApiProperty({ description: 'Submission data (JSON)' })
  @IsObject()
  submissionData: any;

  @ApiPropertyOptional({ description: 'Submission status' })
  @IsString()
  @IsOptional()
  status?: string;
}

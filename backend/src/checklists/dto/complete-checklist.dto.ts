import { IsNotEmpty, IsString, IsOptional, IsUUID, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteChecklistDto {
  @ApiProperty({ description: 'Checklist template ID' })
  @IsNotEmpty()
  @IsUUID()
  checklist_id!: string;

  @ApiProperty({ description: 'User ID who completed the checklist' })
  @IsNotEmpty()
  @IsUUID()
  completed_by!: string;

  @ApiProperty({ description: 'Checklist item responses (item_id -> {checked, notes, photo_url})' })
  @IsNotEmpty()
  @IsObject()
  responses!: Record<string, any>;

  @ApiPropertyOptional({ description: 'Related job ID' })
  @IsOptional()
  @IsUUID()
  job_id?: string;

  @ApiPropertyOptional({ description: 'Related service call ID' })
  @IsOptional()
  @IsUUID()
  service_call_id?: string;

  @ApiPropertyOptional({ description: 'Did the checklist pass all requirements' })
  @IsOptional()
  @IsBoolean()
  passed?: boolean;

  @ApiPropertyOptional({ description: 'Overall notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsDateString, MaxLength, MinLength } from 'class-validator';

export class CreateJobDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Title is required' })
  @MaxLength(255, { message: 'Title cannot exceed 255 characters' })
  title!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(5000, { message: 'Description cannot exceed 5000 characters' })
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  technicians?: any[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  labels?: any[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  checklist?: any[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  milestones?: any[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customer_id?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customer_name?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  due_date?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  assigned_to?: string;
}

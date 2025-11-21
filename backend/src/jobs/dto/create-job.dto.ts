import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsDateString } from 'class-validator';

export class CreateJobDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
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
}

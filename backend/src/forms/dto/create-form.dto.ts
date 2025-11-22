import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsArray, ValidateNested, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum FormFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  TIME = 'time',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  SIGNATURE = 'signature',
  PHOTO = 'photo',
  RATING = 'rating',
}

export class FormFieldDto {
  @ApiProperty({ description: 'Field ID' })
  @IsNotEmpty()
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Field label' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  label!: string;

  @ApiProperty({ enum: FormFieldType, description: 'Field type' })
  @IsNotEmpty()
  @IsEnum(FormFieldType)
  type!: FormFieldType;

  @ApiPropertyOptional({ description: 'Field placeholder' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  placeholder?: string;

  @ApiPropertyOptional({ description: 'Field options (for select/radio)' })
  @IsOptional()
  @IsArray()
  options?: string[];

  @ApiPropertyOptional({ description: 'Is field required' })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ description: 'Field order' })
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ description: 'Field validation rules' })
  @IsOptional()
  validation?: Record<string, any>;
}

export class CreateFormDto {
  @ApiProperty({ description: 'Form name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Form description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ description: 'Form category' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  category!: string;

  @ApiProperty({ description: 'Form fields', type: [FormFieldDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  fields!: FormFieldDto[];

  @ApiPropertyOptional({ description: 'Require signature', default: false })
  @IsOptional()
  @IsBoolean()
  require_signature?: boolean;

  @ApiPropertyOptional({ description: 'Is form active', default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Form settings' })
  @IsOptional()
  settings?: Record<string, any>;
}

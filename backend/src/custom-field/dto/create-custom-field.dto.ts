import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsObject } from 'class-validator';

export class CreateCustomFieldDto {
  @ApiProperty() @IsString() @IsNotEmpty() entityType: string;
  @ApiProperty() @IsString() @IsNotEmpty() fieldName: string;
  @ApiProperty() @IsString() @IsNotEmpty() fieldType: string;
  @ApiPropertyOptional() @IsObject() @IsOptional() fieldOptions?: any;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() required?: boolean;
  @ApiPropertyOptional() @IsString() @IsOptional() defaultValue?: string;
}

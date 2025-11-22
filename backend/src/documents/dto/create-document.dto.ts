import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsObject } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiProperty() @IsString() @IsNotEmpty() filePath: string;
  @ApiPropertyOptional() @IsString() @IsOptional() fileUrl?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() fileType?: string;
  @ApiPropertyOptional() @IsNumber() @IsOptional() fileSize?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() category?: string;
  @ApiPropertyOptional() @IsObject() @IsOptional() tags?: any;
  @ApiProperty() @IsString() @IsNotEmpty() uploadedBy: string;
  @ApiPropertyOptional() @IsString() @IsOptional() entityType?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() entityId?: string;
}

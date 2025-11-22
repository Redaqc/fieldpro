import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateAppSettingsDto {
  @ApiPropertyOptional() @IsObject() @IsOptional() menuModules?: any;
  @ApiPropertyOptional() @IsString() @IsOptional() defaultLanguage?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() timezone?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() dateFormat?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() currency?: string;
  @ApiPropertyOptional() @IsObject() @IsOptional() companyInfo?: any;
}

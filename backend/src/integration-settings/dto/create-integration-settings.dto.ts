import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsDateString } from 'class-validator';

export class CreateIntegrationSettingsDto {
  @ApiProperty() @IsString() @IsNotEmpty() integrationType: string;
  @ApiPropertyOptional() @IsString() @IsOptional() apiKey?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() apiSecret?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() accessToken?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() refreshToken?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() organizationId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() sage50CompanyPath?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() sage50SyncMode?: string;
  @ApiPropertyOptional() @IsOptional() customerFilters?: any;
  @ApiPropertyOptional() @IsOptional() itemFilters?: any;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() enabled?: boolean;
  @ApiPropertyOptional() @IsDateString() @IsOptional() lastSyncDate?: string;
}

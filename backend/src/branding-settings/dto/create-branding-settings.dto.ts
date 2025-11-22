import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateBrandingSettingsDto {
  @ApiPropertyOptional() @IsString() @IsOptional() logoUrl?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() primaryColor?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() secondaryColor?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() companyName?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() companyTagline?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() faviconUrl?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() loginBackgroundUrl?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() emailLogoUrl?: string;
}

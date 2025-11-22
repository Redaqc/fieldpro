import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CreateCompanyInfoDto {
  @ApiProperty() @IsString() @IsNotEmpty() companyName: string;
  @ApiPropertyOptional() @IsString() @IsOptional() address?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() city?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() state?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() zipCode?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() phone?: string;
  @ApiPropertyOptional() @IsEmail() @IsOptional() email?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() website?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() taxId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() logoUrl?: string;
}

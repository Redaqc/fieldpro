import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsArray, MaxLength, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'First name is required' })
  @MaxLength(100, { message: 'First name cannot exceed 100 characters' })
  first_name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Last name is required' })
  @MaxLength(100, { message: 'Last name cannot exceed 100 characters' })
  last_name!: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
  email!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(50, { message: 'Phone cannot exceed 50 characters' })
  phone!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Company name cannot exceed 255 characters' })
  company_name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Address cannot exceed 1000 characters' })
  address?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Status cannot exceed 50 characters' })
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  is_active?: boolean;
}

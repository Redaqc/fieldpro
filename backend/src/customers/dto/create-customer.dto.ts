import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  companyName: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'john@acme.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '123 Main St', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'New York', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'NY', required: false })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({ example: '10001', required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ example: 'USA', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: 'Preferred customer', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'User password (min 8 characters)' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'User full name', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.TECHNICIAN,
    description: 'User role',
    default: UserRole.TECHNICIAN,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

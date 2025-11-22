import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, MaxLength, Matches, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TenantPlan {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export class CreateTenantDto {
  @ApiProperty({ description: 'Tenant slug (URL-friendly identifier)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug!: string;

  @ApiProperty({ description: 'Tenant name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ enum: TenantPlan, default: TenantPlan.STARTER })
  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;

  @ApiPropertyOptional({ description: 'Maximum number of users', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  max_users?: number;

  @ApiPropertyOptional({ description: 'Maximum number of jobs', default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  max_jobs?: number;

  @ApiPropertyOptional({ description: 'Maximum storage in GB', default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  max_storage_gb?: number;

  @ApiPropertyOptional({ description: 'Tenant settings' })
  @IsOptional()
  settings?: Record<string, any>;
}

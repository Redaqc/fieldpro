import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';
import { CreateTenantDto } from './create-tenant.dto';

// Exclude slug from update DTO (slug cannot be changed after creation)
export class UpdateTenantDto extends PartialType(
  OmitType(CreateTenantDto, ['slug'] as const)
) {
  @ApiPropertyOptional({ description: 'Tenant status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Stripe customer ID' })
  @IsOptional()
  @IsString()
  stripe_customer_id?: string;

  @ApiPropertyOptional({ description: 'Stripe subscription ID' })
  @IsOptional()
  @IsString()
  stripe_subscription_id?: string;

  @ApiPropertyOptional({ description: 'Subscription expiration date' })
  @IsOptional()
  @IsDateString()
  subscription_expires_at?: Date | string;
}

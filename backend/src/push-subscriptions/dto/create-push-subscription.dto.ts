import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreatePushSubscriptionDto {
  @ApiProperty() @IsString() @IsNotEmpty() userEmail: string;
  @ApiProperty() @IsString() @IsNotEmpty() endpoint: string;
  @ApiProperty() @IsString() @IsNotEmpty() keys: string;
  @ApiPropertyOptional({ default: true }) @IsBoolean() @IsOptional() active?: boolean;
}

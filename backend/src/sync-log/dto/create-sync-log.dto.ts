import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsInt, IsOptional, IsDateString, IsObject } from 'class-validator';
import { SyncStatus } from '@prisma/client';

export class CreateSyncLogDto {
  @ApiProperty() @IsString() @IsNotEmpty() integrationType: string;
  @ApiProperty() @IsString() @IsNotEmpty() operation: string;
  @ApiProperty({ enum: SyncStatus }) @IsEnum(SyncStatus) status: SyncStatus;
  @ApiPropertyOptional() @IsInt() @IsOptional() recordsProcessed?: number;
  @ApiPropertyOptional() @IsInt() @IsOptional() recordsCreated?: number;
  @ApiPropertyOptional() @IsInt() @IsOptional() recordsUpdated?: number;
  @ApiPropertyOptional() @IsInt() @IsOptional() recordsFailed?: number;
  @ApiPropertyOptional() @IsObject() @IsOptional() errors?: any;
  @ApiPropertyOptional() @IsObject() @IsOptional() details?: any;
  @ApiProperty() @IsDateString() startedAt: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() completedAt?: string;
}

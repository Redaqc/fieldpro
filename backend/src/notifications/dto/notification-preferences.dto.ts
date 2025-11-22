import { IsBoolean, IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationPreferencesDto {
  @ApiPropertyOptional({ description: 'Enable email notifications', default: true })
  @IsOptional()
  @IsBoolean()
  email_enabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable SMS notifications', default: false })
  @IsOptional()
  @IsBoolean()
  sms_enabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable push notifications', default: true })
  @IsOptional()
  @IsBoolean()
  push_enabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable in-app notifications', default: true })
  @IsOptional()
  @IsBoolean()
  in_app_enabled?: boolean;

  @ApiPropertyOptional({ description: 'Job status change notifications', default: true })
  @IsOptional()
  @IsBoolean()
  notify_job_status?: boolean;

  @ApiPropertyOptional({ description: 'Invoice sent/paid notifications', default: true })
  @IsOptional()
  @IsBoolean()
  notify_invoice?: boolean;

  @ApiPropertyOptional({ description: 'Service call assigned notifications', default: true })
  @IsOptional()
  @IsBoolean()
  notify_service_call?: boolean;

  @ApiPropertyOptional({ description: 'Quote accepted/declined notifications', default: true })
  @IsOptional()
  @IsBoolean()
  notify_quotation?: boolean;

  @ApiPropertyOptional({ description: 'Low stock alerts', default: true })
  @IsOptional()
  @IsBoolean()
  notify_low_stock?: boolean;

  @ApiPropertyOptional({ description: 'Custom notification settings' })
  @IsOptional()
  @IsObject()
  custom_settings?: Record<string, any>;
}

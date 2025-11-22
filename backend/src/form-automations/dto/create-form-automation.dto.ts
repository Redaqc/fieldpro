import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject } from '@nestjs/swagger/node_modules/class-validator';

export class CreateFormAutomationDto {
  @ApiProperty({ description: 'Form template ID' })
  @IsString()
  @IsNotEmpty()
  formTemplateId: string;

  @ApiProperty({ description: 'Trigger conditions (JSON)' })
  @IsObject()
  triggerConditions: any;

  @ApiProperty({ description: 'Automation actions (JSON array)' })
  @IsObject()
  actions: any;

  @ApiPropertyOptional({ description: 'Active status', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

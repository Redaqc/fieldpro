import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateDashboardConfigDto {
  @ApiProperty() @IsString() @IsNotEmpty() userId: string;
  @ApiProperty() @IsObject() visibleWidgets: any;
  @ApiPropertyOptional() @IsObject() @IsOptional() widgetPositions?: any;
  @ApiPropertyOptional() @IsString() @IsOptional() defaultView?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsOptional, IsBoolean } from 'class-validator';

export class CreateTeamMessageDto {
  @ApiProperty() @IsEmail() senderEmail: string;
  @ApiProperty() @IsEmail() recipientEmail: string;
  @ApiProperty() @IsString() @IsNotEmpty() message: string;
  @ApiPropertyOptional() @IsString() @IsOptional() channel?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() read?: boolean;
}

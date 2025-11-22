import { PartialType } from '@nestjs/swagger';
import { CreateGPSZoneDto } from './create-gps-zone.dto';

export class UpdateGPSZoneDto extends PartialType(CreateGPSZoneDto) {}

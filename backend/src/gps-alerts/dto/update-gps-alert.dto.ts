import { PartialType } from '@nestjs/swagger';
import { CreateGPSAlertDto } from './create-gps-alert.dto';

export class UpdateGPSAlertDto extends PartialType(CreateGPSAlertDto) {}

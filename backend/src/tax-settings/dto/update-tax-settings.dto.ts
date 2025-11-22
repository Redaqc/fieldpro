import { PartialType } from '@nestjs/swagger';
import { CreateTaxSettingsDto } from './create-tax-settings.dto';
export class UpdateTaxSettingsDto extends PartialType(CreateTaxSettingsDto) {}

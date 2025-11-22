import { PartialType } from '@nestjs/swagger';
import { CreateBrandingSettingsDto } from './create-branding-settings.dto';
export class UpdateBrandingSettingsDto extends PartialType(CreateBrandingSettingsDto) {}

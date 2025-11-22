import { PartialType } from '@nestjs/swagger';
import { CreateLanguageSettingsDto } from './create-language-settings.dto';
export class UpdateLanguageSettingsDto extends PartialType(CreateLanguageSettingsDto) {}

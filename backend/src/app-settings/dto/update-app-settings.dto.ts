import { PartialType } from '@nestjs/swagger';
import { CreateAppSettingsDto } from './create-app-settings.dto';
export class UpdateAppSettingsDto extends PartialType(CreateAppSettingsDto) {}

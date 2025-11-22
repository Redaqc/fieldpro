import { PartialType } from '@nestjs/swagger';
import { CreateIntegrationSettingsDto } from './create-integration-settings.dto';
export class UpdateIntegrationSettingsDto extends PartialType(CreateIntegrationSettingsDto) {}

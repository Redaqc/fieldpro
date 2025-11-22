import { PartialType } from '@nestjs/swagger';
import { CreateFormAutomationDto } from './create-form-automation.dto';

export class UpdateFormAutomationDto extends PartialType(CreateFormAutomationDto) {}

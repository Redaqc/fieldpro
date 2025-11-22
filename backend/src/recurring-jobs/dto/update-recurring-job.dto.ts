import { PartialType } from '@nestjs/swagger';
import { CreateRecurringJobDto } from './create-recurring-job.dto';

export class UpdateRecurringJobDto extends PartialType(CreateRecurringJobDto) {}

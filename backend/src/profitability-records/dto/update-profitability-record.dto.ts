import { PartialType } from '@nestjs/swagger';
import { CreateProfitabilityRecordDto } from './create-profitability-record.dto';

export class UpdateProfitabilityRecordDto extends PartialType(CreateProfitabilityRecordDto) {}

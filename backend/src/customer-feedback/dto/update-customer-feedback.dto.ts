import { PartialType } from '@nestjs/swagger';
import { CreateCustomerFeedbackDto } from './create-customer-feedback.dto';
export class UpdateCustomerFeedbackDto extends PartialType(CreateCustomerFeedbackDto) {}

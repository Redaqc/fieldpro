import { PartialType } from '@nestjs/swagger';
import { CreateServiceCallDto } from './create-service-call.dto';

export class UpdateServiceCallDto extends PartialType(CreateServiceCallDto) {}

import { PartialType } from '@nestjs/swagger';
import { CreateCompanyInfoDto } from './create-company-info.dto';
export class UpdateCompanyInfoDto extends PartialType(CreateCompanyInfoDto) {}

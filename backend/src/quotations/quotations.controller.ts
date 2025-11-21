import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('quotations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quotation' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() createDto: CreateQuotationDto,
  ) {
    return this.quotationsService.create(tenantId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all quotations' })
  findAll(@CurrentTenant() tenantId: string, @Query() filters: any) {
    return this.quotationsService.findAll(tenantId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a quotation by ID' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.quotationsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a quotation' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateQuotationDto,
  ) {
    return this.quotationsService.update(tenantId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a quotation' })
  delete(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.quotationsService.delete(tenantId, id);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept quotation' })
  accept(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.quotationsService.accept(tenantId, id);
  }

  @Post(':id/decline')
  @ApiOperation({ summary: 'Decline quotation' })
  decline(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.quotationsService.decline(tenantId, id, body.reason);
  }

  @Post(':id/convert-to-job')
  @ApiOperation({ summary: 'Convert quotation to job' })
  convertToJob(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.quotationsService.convertToJob(tenantId, id);
  }
}

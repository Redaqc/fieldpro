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
import { Throttle } from '@nestjs/throttler';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { CreateFormSubmissionDto } from './dto/create-form-submission.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantThrottlerGuard } from '../common/guards/tenant-throttler.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('forms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, TenantThrottlerGuard)
@Throttle({ default: { ttl: 60000, limit: 100 } })
@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  // ============================================
  // FORM TEMPLATES
  // ============================================

  @Post()
  @ApiOperation({ summary: 'Create a new form template' })
  create(@CurrentTenant() tenantId: string, @Body() createDto: CreateFormDto) {
    return this.formsService.create(tenantId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all form templates' })
  findAll(@CurrentTenant() tenantId: string, @Query() filters: any) {
    return this.formsService.findAll(tenantId, filters);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all form categories' })
  getCategories(@CurrentTenant() tenantId: string) {
    return this.formsService.getCategories(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a form template by ID' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.formsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a form template' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateFormDto,
  ) {
    return this.formsService.update(tenantId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a form template' })
  delete(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.formsService.delete(tenantId, id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive/deactivate a form template' })
  archive(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.formsService.archive(tenantId, id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a form template' })
  duplicate(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.formsService.duplicate(tenantId, id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get form submission statistics' })
  getStats(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.formsService.getFormStats(tenantId, id);
  }

  // ============================================
  // FORM SUBMISSIONS
  // ============================================

  @Post('submissions')
  @ApiOperation({ summary: 'Submit a form' })
  submitForm(
    @CurrentTenant() tenantId: string,
    @Body() createDto: CreateFormSubmissionDto,
  ) {
    return this.formsService.submitForm(tenantId, createDto);
  }

  @Get('submissions')
  @ApiOperation({ summary: 'Get all form submissions' })
  findAllSubmissions(@CurrentTenant() tenantId: string, @Query() filters: any) {
    return this.formsService.findAllSubmissions(tenantId, filters);
  }

  @Get('submissions/:id')
  @ApiOperation({ summary: 'Get a form submission by ID' })
  findOneSubmission(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.formsService.findOneSubmission(tenantId, id);
  }

  @Delete('submissions/:id')
  @ApiOperation({ summary: 'Delete a form submission' })
  deleteSubmission(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.formsService.deleteSubmission(tenantId, id);
  }
}

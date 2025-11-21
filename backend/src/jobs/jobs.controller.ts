import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiOperation({ summary: 'Create job' })
  create(@CurrentTenant() tenantId: string, @Body() createJobDto: CreateJobDto) {
    return this.jobsService.create(tenantId, createJobDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all jobs' })
  findAll(@CurrentTenant() tenantId: string, @Query() filters: any) {
    return this.jobsService.findAll(tenantId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.jobsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update job' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
  ) {
    return this.jobsService.update(tenantId, id, updateJobDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete job' })
  delete(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.jobsService.delete(tenantId, id);
  }
}

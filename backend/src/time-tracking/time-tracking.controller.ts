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
import { TimeTrackingService } from './time-tracking.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantThrottlerGuard } from '../common/guards/tenant-throttler.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('time-tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, TenantThrottlerGuard)
@Throttle({ default: { ttl: 60000, limit: 100 } })
@Controller('time-tracking')
export class TimeTrackingController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new time entry' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() createDto: CreateTimeEntryDto,
  ) {
    return this.timeTrackingService.create(tenantId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all time entries' })
  findAll(@CurrentTenant() tenantId: string, @Query() filters: any) {
    return this.timeTrackingService.findAll(tenantId, filters);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active time entry for current user' })
  getActive(@CurrentTenant() tenantId: string, @CurrentUser() user: any) {
    return this.timeTrackingService.getActiveEntry(tenantId, user.sub);
  }

  @Post('clock-in')
  @ApiOperation({ summary: 'Clock in - start time tracking' })
  clockIn(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body() metadata: any,
  ) {
    return this.timeTrackingService.clockIn(
      tenantId,
      user.sub,
      metadata?.type,
      metadata,
    );
  }

  @Post('clock-out')
  @ApiOperation({ summary: 'Clock out - stop time tracking' })
  clockOut(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body() body: { notes?: string },
  ) {
    return this.timeTrackingService.clockOut(tenantId, user.sub, body?.notes);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get time summary for current user' })
  getSummary(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.timeTrackingService.getTimeSummary(
      tenantId,
      user.sub,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('billable-amount')
  @ApiOperation({ summary: 'Get total billable amount for time entries' })
  getBillableAmount(@CurrentTenant() tenantId: string, @Query() filters: any) {
    return this.timeTrackingService.getBillableAmount(tenantId, filters);
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get time entries for a specific job' })
  getJobTimeEntries(
    @CurrentTenant() tenantId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.timeTrackingService.getJobTimeEntries(tenantId, jobId);
  }

  @Get('service-call/:serviceCallId')
  @ApiOperation({ summary: 'Get time entries for a specific service call' })
  getServiceCallTimeEntries(
    @CurrentTenant() tenantId: string,
    @Param('serviceCallId') serviceCallId: string,
  ) {
    return this.timeTrackingService.getServiceCallTimeEntries(tenantId, serviceCallId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a time entry by ID' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.timeTrackingService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a time entry' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateTimeEntryDto,
  ) {
    return this.timeTrackingService.update(tenantId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a time entry' })
  delete(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.timeTrackingService.delete(tenantId, id);
  }
}

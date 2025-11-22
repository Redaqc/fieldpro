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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { TimeEntriesService } from './time-entries.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Time Entries')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('time-entries')
export class TimeEntriesController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Create a new time entry (clock in)' })
  @ApiResponse({ status: 201, description: 'Time entry created successfully' })
  @ApiResponse({ status: 404, description: 'Technician or Job not found' })
  create(@Body() createTimeEntryDto: CreateTimeEntryDto) {
    return this.timeEntriesService.create(createTimeEntryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all time entries with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'technicianId', required: false })
  @ApiQuery({ name: 'jobId', required: false })
  @ApiQuery({ name: 'billable', required: false, type: Boolean })
  @ApiQuery({ name: 'startDate', required: false, description: 'ISO date string' })
  @ApiQuery({ name: 'endDate', required: false, description: 'ISO date string' })
  @ApiResponse({ status: 200, description: 'List of time entries' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('technicianId') technicianId?: string,
    @Query('jobId') jobId?: string,
    @Query('billable') billable?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.timeEntriesService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      technicianId,
      jobId,
      billable !== undefined ? billable === 'true' : undefined,
      startDate,
      endDate,
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get time entry statistics' })
  @ApiQuery({ name: 'technicianId', required: false })
  @ApiQuery({ name: 'jobId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Time entry statistics' })
  getStatistics(
    @Query('technicianId') technicianId?: string,
    @Query('jobId') jobId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.timeEntriesService.getStatistics(technicianId, jobId, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get time entry by ID with related data' })
  @ApiResponse({ status: 200, description: 'Time entry found' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  findOne(@Param('id') id: string) {
    return this.timeEntriesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Update time entry' })
  @ApiResponse({ status: 200, description: 'Time entry updated successfully' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  update(@Param('id') id: string, @Body() updateTimeEntryDto: UpdateTimeEntryDto) {
    return this.timeEntriesService.update(id, updateTimeEntryDto);
  }

  @Patch(':id/clock-out')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Clock out from time entry' })
  @ApiResponse({ status: 200, description: 'Clocked out successfully' })
  @ApiResponse({ status: 400, description: 'Already clocked out' })
  clockOut(@Param('id') id: string, @Body('endTime') endTime?: string) {
    return this.timeEntriesService.clockOut(id, endTime ? new Date(endTime) : undefined);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete time entry (Admin only)' })
  @ApiResponse({ status: 200, description: 'Time entry deleted' })
  remove(@Param('id') id: string) {
    return this.timeEntriesService.remove(id);
  }
}

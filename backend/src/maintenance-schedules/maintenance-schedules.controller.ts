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
import { MaintenanceSchedulesService } from './maintenance-schedules.service';
import { CreateMaintenanceScheduleDto } from './dto/create-maintenance-schedule.dto';
import { UpdateMaintenanceScheduleDto } from './dto/update-maintenance-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Maintenance Schedules')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('maintenance-schedules')
export class MaintenanceSchedulesController {
  constructor(
    private readonly maintenanceSchedulesService: MaintenanceSchedulesService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new maintenance schedule' })
  @ApiResponse({
    status: 201,
    description: 'Maintenance schedule created successfully',
  })
  @ApiResponse({ status: 404, description: 'Asset or Technician not found' })
  create(@Body() createMaintenanceScheduleDto: CreateMaintenanceScheduleDto) {
    return this.maintenanceSchedulesService.create(createMaintenanceScheduleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all maintenance schedules with filters' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'assetId', required: false })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'assignedTo', required: false })
  @ApiResponse({ status: 200, description: 'List of maintenance schedules' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('assetId') assetId?: string,
    @Query('active') active?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.maintenanceSchedulesService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      assetId,
      active !== undefined ? active === 'true' : undefined,
      assignedTo,
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get maintenance schedule statistics' })
  @ApiQuery({ name: 'assetId', required: false })
  @ApiResponse({ status: 200, description: 'Maintenance schedule statistics' })
  getStatistics(@Query('assetId') assetId?: string) {
    return this.maintenanceSchedulesService.getStatistics(assetId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get maintenance schedule by ID with asset data' })
  @ApiResponse({ status: 200, description: 'Maintenance schedule found' })
  @ApiResponse({ status: 404, description: 'Maintenance schedule not found' })
  findOne(@Param('id') id: string) {
    return this.maintenanceSchedulesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update maintenance schedule' })
  @ApiResponse({
    status: 200,
    description: 'Maintenance schedule updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Maintenance schedule not found' })
  update(
    @Param('id') id: string,
    @Body() updateMaintenanceScheduleDto: UpdateMaintenanceScheduleDto,
  ) {
    return this.maintenanceSchedulesService.update(
      id,
      updateMaintenanceScheduleDto,
    );
  }

  @Patch(':id/complete')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Mark maintenance as completed' })
  @ApiResponse({
    status: 200,
    description: 'Maintenance completed successfully',
  })
  completeMaintenance(
    @Param('id') id: string,
    @Body('nextMaintenanceDate') nextMaintenanceDate: string,
  ) {
    return this.maintenanceSchedulesService.completeMaintenance(
      id,
      nextMaintenanceDate,
    );
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Toggle maintenance schedule active status' })
  @ApiResponse({ status: 200, description: 'Status toggled successfully' })
  toggleActive(@Param('id') id: string) {
    return this.maintenanceSchedulesService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete maintenance schedule (Admin only)' })
  @ApiResponse({ status: 200, description: 'Maintenance schedule deleted' })
  remove(@Param('id') id: string) {
    return this.maintenanceSchedulesService.remove(id);
  }
}

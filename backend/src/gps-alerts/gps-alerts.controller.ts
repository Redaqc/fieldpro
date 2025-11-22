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
import { UserRole, AlertType } from '@prisma/client';
import { GPSAlertsService } from './gps-alerts.service';
import { CreateGPSAlertDto } from './dto/create-gps-alert.dto';
import { UpdateGPSAlertDto } from './dto/update-gps-alert.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('GPS Alerts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gps-alerts')
export class GPSAlertsController {
  constructor(private readonly gpsAlertsService: GPSAlertsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new GPS alert' })
  @ApiResponse({ status: 201, description: 'GPS alert created successfully' })
  @ApiResponse({ status: 404, description: 'Technician or Zone not found' })
  create(@Body() createGPSAlertDto: CreateGPSAlertDto) {
    return this.gpsAlertsService.create(createGPSAlertDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all GPS alerts with filters' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'technicianId', required: false })
  @ApiQuery({ name: 'zoneId', required: false })
  @ApiQuery({ name: 'alertType', required: false, enum: AlertType })
  @ApiQuery({ name: 'acknowledged', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of GPS alerts' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('technicianId') technicianId?: string,
    @Query('zoneId') zoneId?: string,
    @Query('alertType') alertType?: AlertType,
    @Query('acknowledged') acknowledged?: string,
  ) {
    return this.gpsAlertsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      technicianId,
      zoneId,
      alertType,
      acknowledged !== undefined ? acknowledged === 'true' : undefined,
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get GPS alert statistics' })
  @ApiQuery({ name: 'technicianId', required: false })
  @ApiResponse({ status: 200, description: 'GPS alert statistics' })
  getStatistics(@Query('technicianId') technicianId?: string) {
    return this.gpsAlertsService.getStatistics(technicianId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get GPS alert by ID' })
  @ApiResponse({ status: 200, description: 'GPS alert found' })
  @ApiResponse({ status: 404, description: 'GPS alert not found' })
  findOne(@Param('id') id: string) {
    return this.gpsAlertsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update GPS alert' })
  @ApiResponse({ status: 200, description: 'GPS alert updated successfully' })
  @ApiResponse({ status: 404, description: 'GPS alert not found' })
  update(@Param('id') id: string, @Body() updateGPSAlertDto: UpdateGPSAlertDto) {
    return this.gpsAlertsService.update(id, updateGPSAlertDto);
  }

  @Patch(':id/acknowledge')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Acknowledge GPS alert' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged successfully' })
  acknowledge(@Param('id') id: string) {
    return this.gpsAlertsService.acknowledge(id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete GPS alert (Admin only)' })
  @ApiResponse({ status: 200, description: 'GPS alert deleted' })
  remove(@Param('id') id: string) {
    return this.gpsAlertsService.remove(id);
  }
}

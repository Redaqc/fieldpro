import {
  Controller,
  Get,
  Post,
  Body,
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
import { GPSTrackingService } from './gps-tracking.service';
import { CreateGPSTrackingDto } from './dto/create-gps-tracking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('GPS Tracking')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gps-tracking')
export class GPSTrackingController {
  constructor(private readonly gpsTrackingService: GPSTrackingService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Create a new GPS tracking record' })
  @ApiResponse({ status: 201, description: 'GPS record created successfully' })
  @ApiResponse({ status: 404, description: 'Technician not found' })
  create(@Body() createGPSTrackingDto: CreateGPSTrackingDto) {
    return this.gpsTrackingService.create(createGPSTrackingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all GPS tracking records with filters' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'technicianId', required: false })
  @ApiQuery({ name: 'startDate', required: false, description: 'ISO date string' })
  @ApiQuery({ name: 'endDate', required: false, description: 'ISO date string' })
  @ApiResponse({ status: 200, description: 'List of GPS tracking records' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('technicianId') technicianId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.gpsTrackingService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      technicianId,
      startDate,
      endDate,
    );
  }

  @Get('latest/:technicianId')
  @ApiOperation({ summary: 'Get latest GPS location for a technician' })
  @ApiResponse({ status: 200, description: 'Latest GPS location' })
  getLatest(@Param('technicianId') technicianId: string) {
    return this.gpsTrackingService.getLatestByTechnician(technicianId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get GPS tracking record by ID' })
  @ApiResponse({ status: 200, description: 'GPS tracking record found' })
  @ApiResponse({ status: 404, description: 'GPS tracking record not found' })
  findOne(@Param('id') id: string) {
    return this.gpsTrackingService.findOne(id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete GPS tracking record (Admin only)' })
  @ApiResponse({ status: 200, description: 'GPS tracking record deleted' })
  remove(@Param('id') id: string) {
    return this.gpsTrackingService.remove(id);
  }
}

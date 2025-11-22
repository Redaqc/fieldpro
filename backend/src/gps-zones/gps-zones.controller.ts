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
import { GPSZonesService } from './gps-zones.service';
import { CreateGPSZoneDto } from './dto/create-gps-zone.dto';
import { UpdateGPSZoneDto } from './dto/update-gps-zone.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('GPS Zones')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gps-zones')
export class GPSZonesController {
  constructor(private readonly gpsZonesService: GPSZonesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new GPS zone' })
  @ApiResponse({ status: 201, description: 'GPS zone created successfully' })
  create(@Body() createGPSZoneDto: CreateGPSZoneDto) {
    return this.gpsZonesService.create(createGPSZoneDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all GPS zones with filters' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'zoneType', required: false })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of GPS zones' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('zoneType') zoneType?: string,
    @Query('active') active?: string,
  ) {
    return this.gpsZonesService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      zoneType,
      active !== undefined ? active === 'true' : undefined,
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get GPS zone statistics' })
  @ApiResponse({ status: 200, description: 'GPS zone statistics' })
  getStatistics() {
    return this.gpsZonesService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get GPS zone by ID with recent alerts' })
  @ApiResponse({ status: 200, description: 'GPS zone found' })
  @ApiResponse({ status: 404, description: 'GPS zone not found' })
  findOne(@Param('id') id: string) {
    return this.gpsZonesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update GPS zone' })
  @ApiResponse({ status: 200, description: 'GPS zone updated successfully' })
  @ApiResponse({ status: 404, description: 'GPS zone not found' })
  update(@Param('id') id: string, @Body() updateGPSZoneDto: UpdateGPSZoneDto) {
    return this.gpsZonesService.update(id, updateGPSZoneDto);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Toggle GPS zone active status' })
  @ApiResponse({ status: 200, description: 'Status toggled successfully' })
  toggleActive(@Param('id') id: string) {
    return this.gpsZonesService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete GPS zone (Admin only)' })
  @ApiResponse({ status: 200, description: 'GPS zone deleted' })
  remove(@Param('id') id: string) {
    return this.gpsZonesService.remove(id);
  }
}

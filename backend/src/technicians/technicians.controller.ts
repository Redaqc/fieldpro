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
import { TechniciansService } from './technicians.service';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Technicians')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('technicians')
export class TechniciansController {
  constructor(private readonly techniciansService: TechniciansService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create technician profile (Admin only)' })
  @ApiResponse({ status: 201, description: 'Technician profile created' })
  @ApiResponse({ status: 409, description: 'Profile already exists' })
  create(@Body() createTechnicianDto: CreateTechnicianDto) {
    return this.techniciansService.create(createTechnicianDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all technicians with pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'isAvailable', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of technicians' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isAvailable') isAvailable?: string,
  ) {
    return this.techniciansService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      isAvailable !== undefined ? isAvailable === 'true' : undefined,
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get technician profile by user ID' })
  @ApiResponse({ status: 200, description: 'Technician profile found' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  findByUserId(@Param('userId') userId: string) {
    return this.techniciansService.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get technician by ID with job assignments' })
  @ApiResponse({ status: 200, description: 'Technician found' })
  @ApiResponse({ status: 404, description: 'Technician not found' })
  findOne(@Param('id') id: string) {
    return this.techniciansService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update technician profile' })
  @ApiResponse({ status: 200, description: 'Technician updated' })
  @ApiResponse({ status: 404, description: 'Technician not found' })
  update(@Param('id') id: string, @Body() updateTechnicianDto: UpdateTechnicianDto) {
    return this.techniciansService.update(id, updateTechnicianDto);
  }

  @Patch(':id/location')
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Update technician GPS location' })
  @ApiResponse({ status: 200, description: 'Location updated' })
  updateLocation(
    @Param('id') id: string,
    @Body('latitude') latitude: number,
    @Body('longitude') longitude: number,
  ) {
    return this.techniciansService.updateLocation(id, latitude, longitude);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete technician profile (Admin only)' })
  @ApiResponse({ status: 200, description: 'Technician deleted' })
  remove(@Param('id') id: string) {
    return this.techniciansService.remove(id);
  }
}

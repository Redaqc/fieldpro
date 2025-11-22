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
import { UserRole, ServiceCallStatus, JobPriority } from '@prisma/client';
import { ServiceCallsService } from './service-calls.service';
import { CreateServiceCallDto } from './dto/create-service-call.dto';
import { UpdateServiceCallDto } from './dto/update-service-call.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Service Calls')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('service-calls')
export class ServiceCallsController {
  constructor(private readonly serviceCallsService: ServiceCallsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Create a new service call' })
  @ApiResponse({ status: 201, description: 'Service call created successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  create(@Body() createServiceCallDto: CreateServiceCallDto) {
    return this.serviceCallsService.create(createServiceCallDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all service calls with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: ServiceCallStatus })
  @ApiQuery({ name: 'priority', required: false, enum: JobPriority })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'assignedTo', required: false })
  @ApiResponse({ status: 200, description: 'List of service calls' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ServiceCallStatus,
    @Query('priority') priority?: JobPriority,
    @Query('customerId') customerId?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.serviceCallsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
      priority,
      customerId,
      assignedTo,
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get service call statistics' })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'assignedTo', required: false })
  @ApiResponse({ status: 200, description: 'Service call statistics' })
  getStatistics(
    @Query('customerId') customerId?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.serviceCallsService.getStatistics(customerId, assignedTo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service call by ID with customer details' })
  @ApiResponse({ status: 200, description: 'Service call found' })
  @ApiResponse({ status: 404, description: 'Service call not found' })
  findOne(@Param('id') id: string) {
    return this.serviceCallsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Update service call' })
  @ApiResponse({ status: 200, description: 'Service call updated successfully' })
  @ApiResponse({ status: 404, description: 'Service call not found' })
  update(@Param('id') id: string, @Body() updateServiceCallDto: UpdateServiceCallDto) {
    return this.serviceCallsService.update(id, updateServiceCallDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Update service call status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  updateStatus(@Param('id') id: string, @Body('status') status: ServiceCallStatus) {
    return this.serviceCallsService.updateStatus(id, status);
  }

  @Patch(':id/assign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Assign technician to service call' })
  @ApiResponse({ status: 200, description: 'Technician assigned successfully' })
  assignTechnician(@Param('id') id: string, @Body('technicianId') technicianId: string) {
    return this.serviceCallsService.assignTechnician(id, technicianId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete service call (Admin only)' })
  @ApiResponse({ status: 200, description: 'Service call deleted' })
  remove(@Param('id') id: string) {
    return this.serviceCallsService.remove(id);
  }
}

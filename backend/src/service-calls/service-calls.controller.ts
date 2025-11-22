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
import { ServiceCallsService } from './service-calls.service';
import { CreateServiceCallDto } from './dto/create-service-call.dto';
import { UpdateServiceCallDto } from './dto/update-service-call.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantThrottlerGuard } from '../common/guards/tenant-throttler.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('service-calls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, TenantThrottlerGuard)
@Throttle({ default: { ttl: 60000, limit: 100 } }) // ✅ Added rate limiting: 100 requests per minute per tenant
@Controller('service-calls')
export class ServiceCallsController {
  constructor(private readonly serviceCallsService: ServiceCallsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service call' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() createDto: CreateServiceCallDto,
  ) {
    return this.serviceCallsService.create(tenantId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all service calls' })
  findAll(@CurrentTenant() tenantId: string, @Query() filters: any) {
    return this.serviceCallsService.findAll(tenantId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a service call by ID' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.serviceCallsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a service call' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateServiceCallDto,
  ) {
    return this.serviceCallsService.update(tenantId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a service call' })
  delete(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.serviceCallsService.delete(tenantId, id);
  }

  @Post(':id/assign/:technicianId')
  @ApiOperation({ summary: 'Assign technician to service call' })
  assignTechnician(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Param('technicianId') technicianId: string,
  ) {
    return this.serviceCallsService.assignTechnician(tenantId, id, technicianId);
  }
}

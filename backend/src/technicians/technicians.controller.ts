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
import { TechniciansService } from './technicians.service';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('technicians')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('technicians')
export class TechniciansController {
  constructor(private readonly techniciansService: TechniciansService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new technician' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() createDto: CreateTechnicianDto,
  ) {
    return this.techniciansService.create(tenantId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all technicians' })
  findAll(@CurrentTenant() tenantId: string, @Query() filters: any) {
    return this.techniciansService.findAll(tenantId, filters);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available technicians for a date' })
  getAvailable(
    @CurrentTenant() tenantId: string,
    @Query('date') date: string,
  ) {
    return this.techniciansService.getAvailableTechnicians(
      tenantId,
      new Date(date),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a technician by ID' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.techniciansService.findOne(tenantId, id);
  }

  @Get(':id/schedule')
  @ApiOperation({ summary: 'Get technician schedule' })
  getSchedule(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.techniciansService.getSchedule(
      tenantId,
      id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a technician' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateTechnicianDto,
  ) {
    return this.techniciansService.update(tenantId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a technician' })
  delete(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.techniciansService.delete(tenantId, id);
  }
}

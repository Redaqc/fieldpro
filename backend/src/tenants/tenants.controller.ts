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
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Throttle({ default: { ttl: 60000, limit: 100 } })
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant (super admin only)' })
  create(@Body() createDto: CreateTenantDto) {
    return this.tenantsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenants' })
  findAll(@Query() filters: any) {
    return this.tenantsService.findAll(filters);
  }

  @Get('with-stats')
  @ApiOperation({ summary: 'Get all tenants with usage statistics' })
  findAllWithStats() {
    return this.tenantsService.findAllWithStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tenant by ID' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get tenant statistics' })
  getStats(@Param('id') id: string) {
    return this.tenantsService.getTenantStats(id);
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Get tenant users' })
  getTenantUsers(@Param('id') id: string) {
    return this.tenantsService.getTenantUsers(id);
  }

  @Get(':id/invitations')
  @ApiOperation({ summary: 'Get tenant invitations' })
  getTenantInvitations(@Param('id') id: string) {
    return this.tenantsService.getTenantInvitations(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tenant' })
  update(@Param('id') id: string, @Body() updateDto: UpdateTenantDto) {
    return this.tenantsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tenant (super admin only)' })
  delete(@Param('id') id: string) {
    return this.tenantsService.delete(id);
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspend a tenant (super admin only)' })
  suspend(@Param('id') id: string) {
    return this.tenantsService.suspend(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a tenant (super admin only)' })
  activate(@Param('id') id: string) {
    return this.tenantsService.activate(id);
  }
}

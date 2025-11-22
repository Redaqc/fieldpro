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
import { WorkTypesService } from './work-types.service';
import { CreateWorkTypeDto } from './dto/create-work-type.dto';
import { UpdateWorkTypeDto } from './dto/update-work-type.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantThrottlerGuard } from '../common/guards/tenant-throttler.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('work-types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, TenantThrottlerGuard)
@Throttle({ default: { ttl: 60000, limit: 100 } })
@Controller('work-types')
export class WorkTypesController {
  constructor(private readonly workTypesService: WorkTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new work type' })
  create(@CurrentTenant() tenantId: string, @Body() createDto: CreateWorkTypeDto) {
    return this.workTypesService.create(tenantId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all work types' })
  findAll(@CurrentTenant() tenantId: string, @Query() filters: any) {
    return this.workTypesService.findAll(tenantId, filters);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all work type categories' })
  getCategories(@CurrentTenant() tenantId: string) {
    return this.workTypesService.getCategories(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a work type by ID' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.workTypesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a work type' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateWorkTypeDto,
  ) {
    return this.workTypesService.update(tenantId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a work type' })
  delete(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.workTypesService.delete(tenantId, id);
  }
}

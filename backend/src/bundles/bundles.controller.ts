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
import { BundlesService } from './bundles.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantThrottlerGuard } from '../common/guards/tenant-throttler.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('bundles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, TenantThrottlerGuard)
@Throttle({ default: { ttl: 60000, limit: 100 } })
@Controller('bundles')
export class BundlesController {
  constructor(private readonly bundlesService: BundlesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bundle' })
  create(@CurrentTenant() tenantId: string, @Body() createDto: CreateBundleDto) {
    return this.bundlesService.create(tenantId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bundles' })
  findAll(@CurrentTenant() tenantId: string, @Query() filters: any) {
    return this.bundlesService.findAll(tenantId, filters);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all bundle categories' })
  getCategories(@CurrentTenant() tenantId: string) {
    return this.bundlesService.getCategories(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a bundle by ID' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.bundlesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a bundle' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateBundleDto,
  ) {
    return this.bundlesService.update(tenantId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bundle' })
  delete(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.bundlesService.delete(tenantId, id);
  }
}

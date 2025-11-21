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
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new asset' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() createDto: CreateAssetDto,
  ) {
    return this.assetsService.create(tenantId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all assets' })
  findAll(@CurrentTenant() tenantId: string, @Query() filters: any) {
    return this.assetsService.findAll(tenantId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an asset by ID' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.assetsService.findOne(tenantId, id);
  }

  @Get(':id/maintenance-history')
  @ApiOperation({ summary: 'Get asset maintenance history' })
  getMaintenanceHistory(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.assetsService.getMaintenanceHistory(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an asset' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateAssetDto,
  ) {
    return this.assetsService.update(tenantId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an asset' })
  delete(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.assetsService.delete(tenantId, id);
  }
}

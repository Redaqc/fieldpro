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
import { PriceListsService } from './price-lists.service';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { UpdatePriceListDto } from './dto/update-price-list.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantThrottlerGuard } from '../common/guards/tenant-throttler.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('price-lists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, TenantThrottlerGuard)
@Throttle({ default: { ttl: 60000, limit: 100 } })
@Controller('price-lists')
export class PriceListsController {
  constructor(private readonly priceListsService: PriceListsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new price list' })
  create(@CurrentTenant() tenantId: string, @Body() createDto: CreatePriceListDto) {
    return this.priceListsService.create(tenantId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all price lists' })
  findAll(@CurrentTenant() tenantId: string, @Query() filters: any) {
    return this.priceListsService.findAll(tenantId, filters);
  }

  @Get('default')
  @ApiOperation({ summary: 'Get the default price list' })
  getDefault(@CurrentTenant() tenantId: string) {
    return this.priceListsService.getDefault(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a price list by ID' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.priceListsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a price list' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdatePriceListDto,
  ) {
    return this.priceListsService.update(tenantId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a price list' })
  delete(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.priceListsService.delete(tenantId, id);
  }

  @Post(':id/set-default')
  @ApiOperation({ summary: 'Set this price list as the default' })
  setDefault(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.priceListsService.setDefault(tenantId, id);
  }
}

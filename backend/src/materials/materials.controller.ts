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
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('materials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new material' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() createDto: CreateMaterialDto,
  ) {
    return this.materialsService.create(tenantId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all materials' })
  findAll(@CurrentTenant() tenantId: string, @Query() filters: any) {
    return this.materialsService.findAll(tenantId, filters);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock items' })
  getLowStock(@CurrentTenant() tenantId: string) {
    return this.materialsService.getLowStockItems(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a material by ID' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.materialsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a material' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateMaterialDto,
  ) {
    return this.materialsService.update(tenantId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a material' })
  delete(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.materialsService.delete(tenantId, id);
  }

  @Post(':id/adjust-stock')
  @ApiOperation({ summary: 'Adjust material stock' })
  adjustStock(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: { adjustment: number; reason?: string },
  ) {
    return this.materialsService.adjustStock(
      tenantId,
      id,
      body.adjustment,
      body.reason,
    );
  }
}

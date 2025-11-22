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
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Materials')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new material' })
  @ApiResponse({ status: 201, description: 'Material created successfully' })
  @ApiResponse({ status: 409, description: 'Material with SKU already exists' })
  create(@Body() createMaterialDto: CreateMaterialDto) {
    return this.materialsService.create(createMaterialDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all materials with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name, SKU, or description' })
  @ApiQuery({ name: 'lowStock', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of materials' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('lowStock') lowStock?: string,
  ) {
    return this.materialsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      category,
      search,
      lowStock === 'true',
    );
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get materials with low stock' })
  @ApiResponse({ status: 200, description: 'List of low stock materials' })
  getLowStockItems() {
    return this.materialsService.getLowStockItems();
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get material inventory statistics' })
  @ApiQuery({ name: 'category', required: false })
  @ApiResponse({ status: 200, description: 'Material statistics' })
  getStatistics(@Query('category') category?: string) {
    return this.materialsService.getStatistics(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get material by ID' })
  @ApiResponse({ status: 200, description: 'Material found' })
  @ApiResponse({ status: 404, description: 'Material not found' })
  findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update material' })
  @ApiResponse({ status: 200, description: 'Material updated successfully' })
  @ApiResponse({ status: 404, description: 'Material not found' })
  update(@Param('id') id: string, @Body() updateMaterialDto: UpdateMaterialDto) {
    return this.materialsService.update(id, updateMaterialDto);
  }

  @Patch(':id/stock')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Adjust material stock quantity' })
  @ApiResponse({ status: 200, description: 'Stock adjusted successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient stock' })
  adjustStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
    @Body('operation') operation: 'add' | 'subtract',
  ) {
    return this.materialsService.adjustStock(id, quantity, operation);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete material (Admin only)' })
  @ApiResponse({ status: 200, description: 'Material deleted' })
  remove(@Param('id') id: string) {
    return this.materialsService.remove(id);
  }
}

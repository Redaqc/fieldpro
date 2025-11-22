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
import { PriceListsService } from './price-lists.service';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { UpdatePriceListDto } from './dto/update-price-list.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Price Lists')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('price-lists')
export class PriceListsController {
  constructor(private readonly priceListsService: PriceListsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new price list item' })
  @ApiResponse({ status: 201, description: 'Price list item created' })
  create(@Body() createPriceListDto: CreatePriceListDto) {
    return this.priceListsService.create(createPriceListDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all price list items with filters' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'List of price list items' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('active') active?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.priceListsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      active !== undefined ? active === 'true' : undefined,
      category,
      search,
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get price list statistics' })
  @ApiQuery({ name: 'category', required: false })
  @ApiResponse({ status: 200, description: 'Price list statistics' })
  getStatistics(@Query('category') category?: string) {
    return this.priceListsService.getStatistics(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get price list item by ID' })
  @ApiResponse({ status: 200, description: 'Price list item found' })
  @ApiResponse({ status: 404, description: 'Price list item not found' })
  findOne(@Param('id') id: string) {
    return this.priceListsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update price list item' })
  @ApiResponse({ status: 200, description: 'Price list item updated' })
  @ApiResponse({ status: 404, description: 'Price list item not found' })
  update(
    @Param('id') id: string,
    @Body() updatePriceListDto: UpdatePriceListDto,
  ) {
    return this.priceListsService.update(id, updatePriceListDto);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Toggle price list item active status' })
  @ApiResponse({ status: 200, description: 'Status toggled successfully' })
  toggleActive(@Param('id') id: string) {
    return this.priceListsService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete price list item (Admin only)' })
  @ApiResponse({ status: 200, description: 'Price list item deleted' })
  remove(@Param('id') id: string) {
    return this.priceListsService.remove(id);
  }
}

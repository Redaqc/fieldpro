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
import { BundlesService } from './bundles.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Bundles')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bundles')
export class BundlesController {
  constructor(private readonly bundlesService: BundlesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new bundle' })
  @ApiResponse({ status: 201, description: 'Bundle created successfully' })
  create(@Body() createBundleDto: CreateBundleDto) {
    return this.bundlesService.create(createBundleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bundles with filters' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'List of bundles' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('active') active?: string,
    @Query('search') search?: string,
  ) {
    return this.bundlesService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      active !== undefined ? active === 'true' : undefined,
      search,
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get bundle statistics' })
  @ApiResponse({ status: 200, description: 'Bundle statistics' })
  getStatistics() {
    return this.bundlesService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bundle by ID' })
  @ApiResponse({ status: 200, description: 'Bundle found' })
  @ApiResponse({ status: 404, description: 'Bundle not found' })
  findOne(@Param('id') id: string) {
    return this.bundlesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update bundle' })
  @ApiResponse({ status: 200, description: 'Bundle updated successfully' })
  @ApiResponse({ status: 404, description: 'Bundle not found' })
  update(@Param('id') id: string, @Body() updateBundleDto: UpdateBundleDto) {
    return this.bundlesService.update(id, updateBundleDto);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Toggle bundle active status' })
  @ApiResponse({ status: 200, description: 'Status toggled successfully' })
  toggleActive(@Param('id') id: string) {
    return this.bundlesService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete bundle (Admin only)' })
  @ApiResponse({ status: 200, description: 'Bundle deleted' })
  remove(@Param('id') id: string) {
    return this.bundlesService.remove(id);
  }
}

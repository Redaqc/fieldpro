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
import { WorkTypesService } from './work-types.service';
import { CreateWorkTypeDto } from './dto/create-work-type.dto';
import { UpdateWorkTypeDto } from './dto/update-work-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Work Types')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('work-types')
export class WorkTypesController {
  constructor(private readonly workTypesService: WorkTypesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new work type' })
  @ApiResponse({ status: 201, description: 'Work type created successfully' })
  @ApiResponse({ status: 409, description: 'Work type name already exists' })
  create(@Body() createWorkTypeDto: CreateWorkTypeDto) {
    return this.workTypesService.create(createWorkTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all work types with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in name, description, label',
  })
  @ApiResponse({ status: 200, description: 'List of work types' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('active') active?: string,
    @Query('search') search?: string,
  ) {
    return this.workTypesService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      active !== undefined ? active === 'true' : undefined,
      search,
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get work type statistics' })
  @ApiResponse({ status: 200, description: 'Work type statistics' })
  getStatistics() {
    return this.workTypesService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get work type by ID' })
  @ApiResponse({ status: 200, description: 'Work type found' })
  @ApiResponse({ status: 404, description: 'Work type not found' })
  findOne(@Param('id') id: string) {
    return this.workTypesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update work type' })
  @ApiResponse({ status: 200, description: 'Work type updated successfully' })
  @ApiResponse({ status: 404, description: 'Work type not found' })
  @ApiResponse({ status: 409, description: 'Work type name already exists' })
  update(
    @Param('id') id: string,
    @Body() updateWorkTypeDto: UpdateWorkTypeDto,
  ) {
    return this.workTypesService.update(id, updateWorkTypeDto);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Toggle work type active status' })
  @ApiResponse({ status: 200, description: 'Status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Work type not found' })
  toggleActive(@Param('id') id: string) {
    return this.workTypesService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete work type (Admin only)' })
  @ApiResponse({ status: 200, description: 'Work type deleted' })
  @ApiResponse({ status: 404, description: 'Work type not found' })
  remove(@Param('id') id: string) {
    return this.workTypesService.remove(id);
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { DashboardConfigService } from './dashboard-config.service';
import { CreateDashboardConfigDto } from './dto/create-dashboard-config.dto';
import { UpdateDashboardConfigDto } from './dto/update-dashboard-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Dashboard Config')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard-config')
export class DashboardConfigController {
  constructor(private readonly service: DashboardConfigService) {}

  @Post()
  @ApiOperation({ summary: 'Create dashboard config' })
  create(@Body() dto: CreateDashboardConfigDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all dashboard configs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'userId', required: false })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('userId') userId?: string) {
    return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get dashboard config by user ID' })
  findByUserId(@Param('userId') userId: string) {
    return this.service.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dashboard config by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update dashboard config' })
  update(@Param('id') id: string, @Body() dto: UpdateDashboardConfigDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete dashboard config' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AppSettingsService } from './app-settings.service';
import { CreateAppSettingsDto } from './dto/create-app-settings.dto';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('App Settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('app-settings')
export class AppSettingsController {
  constructor(private readonly service: AppSettingsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create app settings' })
  create(@Body() dto: CreateAppSettingsDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all app settings' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current app settings' })
  getCurrent() {
    return this.service.getCurrent();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get app settings by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update app settings' })
  update(@Param('id') id: string, @Body() dto: UpdateAppSettingsDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete app settings' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

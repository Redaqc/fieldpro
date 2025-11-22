import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { BrandingSettingsService } from './branding-settings.service';
import { CreateBrandingSettingsDto } from './dto/create-branding-settings.dto';
import { UpdateBrandingSettingsDto } from './dto/update-branding-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Branding Settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branding-settings')
export class BrandingSettingsController {
  constructor(private readonly service: BrandingSettingsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create branding settings' })
  create(@Body() dto: CreateBrandingSettingsDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all branding settings' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current branding settings' })
  getCurrent() {
    return this.service.getCurrent();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branding settings by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update branding settings' })
  update(@Param('id') id: string, @Body() dto: UpdateBrandingSettingsDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete branding settings' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

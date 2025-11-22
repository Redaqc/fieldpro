import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IntegrationSettingsService } from './integration-settings.service';
import { CreateIntegrationSettingsDto } from './dto/create-integration-settings.dto';
import { UpdateIntegrationSettingsDto } from './dto/update-integration-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Integration Settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('integration-settings')
export class IntegrationSettingsController {
  constructor(private readonly service: IntegrationSettingsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create integration settings' })
  create(@Body() dto: CreateIntegrationSettingsDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all integration settings' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'integrationType', required: false })
  @ApiQuery({ name: 'enabled', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('integrationType') integrationType?: string,
    @Query('enabled') enabled?: string,
  ) {
    return this.service.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      integrationType,
      enabled === 'true' ? true : enabled === 'false' ? false : undefined,
    );
  }

  @Get('type/:integrationType')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get integration settings by type' })
  findByType(@Param('integrationType') integrationType: string) {
    return this.service.findByType(integrationType);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get integration settings by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update integration settings' })
  update(@Param('id') id: string, @Body() dto: UpdateIntegrationSettingsDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete integration settings' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

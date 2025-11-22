import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole, IntegrationType } from '@prisma/client';
import { IntegrationService } from './integration.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Integrations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('integration')
export class IntegrationController {
  constructor(private readonly service: IntegrationService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create integration' })
  create(@Body() dto: CreateIntegrationDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all integrations' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'type', required: false, enum: IntegrationType })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: IntegrationType,
    @Query('status') status?: string,
  ) {
    return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, type, status);
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get integrations by type' })
  findByType(@Param('type') type: IntegrationType) {
    return this.service.findByType(type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get integration by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update integration' })
  update(@Param('id') id: string, @Body() dto: UpdateIntegrationDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete integration' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

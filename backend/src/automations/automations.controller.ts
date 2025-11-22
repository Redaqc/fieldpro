import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AutomationsService } from './automations.service';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Automations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('automations')
export class AutomationsController {
  constructor(private readonly service: AutomationsService) {}
  @Post() @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) @ApiOperation({ summary: 'Create automation' })
  create(@Body() dto: CreateAutomationDto) { return this.service.create(dto); }
  @Get() @ApiOperation({ summary: 'Get all automations' }) @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false }) @ApiQuery({ name: 'active', required: false, type: Boolean })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('active') active?: string) {
    return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, active !== undefined ? active === 'true' : undefined);
  }
  @Get(':id') @ApiOperation({ summary: 'Get automation by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) @ApiOperation({ summary: 'Update automation' })
  update(@Param('id') id: string, @Body() dto: UpdateAutomationDto) { return this.service.update(id, dto); }
  @Patch(':id/toggle-active') @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) @ApiOperation({ summary: 'Toggle automation active status' })
  toggleActive(@Param('id') id: string) { return this.service.toggleActive(id); }
  @Delete(':id') @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) @ApiOperation({ summary: 'Delete automation' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}

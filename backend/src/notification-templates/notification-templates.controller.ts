import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { NotificationTemplatesService } from './notification-templates.service';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Notification Templates')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notification-templates')
export class NotificationTemplatesController {
  constructor(private readonly service: NotificationTemplatesService) {}
  @Post() @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) @ApiOperation({ summary: 'Create notification template' })
  create(@Body() dto: CreateNotificationTemplateDto) { return this.service.create(dto); }
  @Get() @ApiOperation({ summary: 'Get all notification templates' }) @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false }) @ApiQuery({ name: 'type', required: false }) @ApiQuery({ name: 'active', required: false, type: Boolean })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('type') type?: string, @Query('active') active?: string) {
    return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, type, active !== undefined ? active === 'true' : undefined);
  }
  @Get(':id') @ApiOperation({ summary: 'Get notification template by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) @ApiOperation({ summary: 'Update notification template' })
  update(@Param('id') id: string, @Body() dto: UpdateNotificationTemplateDto) { return this.service.update(id, dto); }
  @Patch(':id/toggle-active') @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) @ApiOperation({ summary: 'Toggle template active status' })
  toggleActive(@Param('id') id: string) { return this.service.toggleActive(id); }
  @Delete(':id') @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) @ApiOperation({ summary: 'Delete notification template' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}

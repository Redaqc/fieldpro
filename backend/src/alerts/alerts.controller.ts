import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole, NotificationType } from '@prisma/client';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Alerts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly service: AlertsService) {}
  @Post() @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) @ApiOperation({ summary: 'Create alert' })
  create(@Body() dto: CreateAlertDto) { return this.service.create(dto); }
  @Get() @ApiOperation({ summary: 'Get all alerts' }) @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false }) @ApiQuery({ name: 'userId', required: false }) @ApiQuery({ name: 'read', required: false, type: Boolean }) @ApiQuery({ name: 'type', required: false, enum: NotificationType })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('userId') userId?: string, @Query('read') read?: string, @Query('type') type?: NotificationType) {
    return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, userId, read !== undefined ? read === 'true' : undefined, type);
  }
  @Get(':id') @ApiOperation({ summary: 'Get alert by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') @ApiOperation({ summary: 'Update alert' })
  update(@Param('id') id: string, @Body() dto: UpdateAlertDto) { return this.service.update(id, dto); }
  @Patch(':id/read') @ApiOperation({ summary: 'Mark alert as read' })
  markAsRead(@Param('id') id: string) { return this.service.markAsRead(id); }
  @Delete(':id') @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) @ApiOperation({ summary: 'Delete alert' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}

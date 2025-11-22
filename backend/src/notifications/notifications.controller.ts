import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole, NotificationType } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}
  @Post() @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) @ApiOperation({ summary: 'Create notification' })
  create(@Body() dto: CreateNotificationDto) { return this.service.create(dto); }
  @Get() @ApiOperation({ summary: 'Get all notifications' }) @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false }) @ApiQuery({ name: 'userId', required: false }) @ApiQuery({ name: 'read', required: false, type: Boolean }) @ApiQuery({ name: 'type', required: false, enum: NotificationType })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('userId') userId?: string, @Query('read') read?: string, @Query('type') type?: NotificationType) {
    return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, userId, read !== undefined ? read === 'true' : undefined, type);
  }
  @Get(':id') @ApiOperation({ summary: 'Get notification by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') @ApiOperation({ summary: 'Update notification' })
  update(@Param('id') id: string, @Body() dto: UpdateNotificationDto) { return this.service.update(id, dto); }
  @Patch(':id/read') @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(@Param('id') id: string) { return this.service.markAsRead(id); }
  @Patch('user/:userId/read-all') @ApiOperation({ summary: 'Mark all user notifications as read' })
  markAllAsRead(@Param('userId') userId: string) { return this.service.markAllAsRead(userId); }
  @Delete(':id') @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) @ApiOperation({ summary: 'Delete notification' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}

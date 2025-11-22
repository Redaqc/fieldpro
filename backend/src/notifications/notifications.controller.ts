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
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationPreferencesDto } from './dto/notification-preferences.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantThrottlerGuard } from '../common/guards/tenant-throttler.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, TenantThrottlerGuard)
@Throttle({ default: { ttl: 60000, limit: 100 } })
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() createDto: CreateNotificationDto,
  ) {
    return this.notificationsService.create(tenantId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  findAll(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Query() filters: any,
  ) {
    // Automatically filter by current user
    const userFilters = { ...filters, user_id: user.sub };
    return this.notificationsService.findAll(tenantId, userFilters);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count for current user' })
  getUnreadCount(@CurrentTenant() tenantId: string, @CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(tenantId, user.sub);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences for current user' })
  getPreferences(@CurrentTenant() tenantId: string, @CurrentUser() user: any) {
    return this.notificationsService.getUserPreferences(tenantId, user.sub);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update notification preferences for current user' })
  updatePreferences(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body() preferences: NotificationPreferencesDto,
  ) {
    return this.notificationsService.updateUserPreferences(
      tenantId,
      user.sub,
      preferences,
    );
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  markAllAsRead(@CurrentTenant() tenantId: string, @CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(tenantId, user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a notification by ID' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.notificationsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a notification' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(tenantId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  delete(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.notificationsService.delete(tenantId, id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.notificationsService.markAsRead(tenantId, id);
  }
}

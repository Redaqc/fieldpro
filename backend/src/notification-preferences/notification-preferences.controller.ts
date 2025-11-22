import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { NotificationPreferencesService } from './notification-preferences.service';
import { CreateNotificationPreferenceDto } from './dto/create-notification-preference.dto';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Notification Preferences')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notification-preferences')
export class NotificationPreferencesController {
  constructor(private readonly service: NotificationPreferencesService) {}
  @Post() @ApiOperation({ summary: 'Create notification preferences' })
  create(@Body() dto: CreateNotificationPreferenceDto) { return this.service.create(dto); }
  @Get() @ApiOperation({ summary: 'Get all notification preferences' }) @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }
  @Get('user/:userId') @ApiOperation({ summary: 'Get notification preferences by user ID' })
  findByUser(@Param('userId') userId: string) { return this.service.findByUser(userId); }
  @Get(':id') @ApiOperation({ summary: 'Get notification preferences by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') @ApiOperation({ summary: 'Update notification preferences' })
  update(@Param('id') id: string, @Body() dto: UpdateNotificationPreferenceDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) @ApiOperation({ summary: 'Delete notification preferences' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}

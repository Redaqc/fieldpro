import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PushSubscriptionsService } from './push-subscriptions.service';
import { CreatePushSubscriptionDto } from './dto/create-push-subscription.dto';
import { UpdatePushSubscriptionDto } from './dto/update-push-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Push Subscriptions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('push-subscriptions')
export class PushSubscriptionsController {
  constructor(private readonly service: PushSubscriptionsService) {}
  @Post() @ApiOperation({ summary: 'Create push subscription' })
  create(@Body() dto: CreatePushSubscriptionDto) { return this.service.create(dto); }
  @Get() @ApiOperation({ summary: 'Get all push subscriptions' }) @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false }) @ApiQuery({ name: 'userEmail', required: false }) @ApiQuery({ name: 'active', required: false, type: Boolean })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('userEmail') userEmail?: string, @Query('active') active?: string) {
    return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, userEmail, active !== undefined ? active === 'true' : undefined);
  }
  @Get(':id') @ApiOperation({ summary: 'Get push subscription by ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') @ApiOperation({ summary: 'Update push subscription' })
  update(@Param('id') id: string, @Body() dto: UpdatePushSubscriptionDto) { return this.service.update(id, dto); }
  @Patch(':id/toggle-active') @ApiOperation({ summary: 'Toggle subscription active status' })
  toggleActive(@Param('id') id: string) { return this.service.toggleActive(id); }
  @Delete(':id') @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) @ApiOperation({ summary: 'Delete push subscription' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}

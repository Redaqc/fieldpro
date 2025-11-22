import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole, SyncStatus } from '@prisma/client';
import { SyncLogService } from './sync-log.service';
import { CreateSyncLogDto } from './dto/create-sync-log.dto';
import { UpdateSyncLogDto } from './dto/update-sync-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Sync Logs')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sync-log')
export class SyncLogController {
  constructor(private readonly service: SyncLogService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create sync log' })
  create(@Body() dto: CreateSyncLogDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all sync logs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'integrationType', required: false })
  @ApiQuery({ name: 'status', required: false, enum: SyncStatus })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('integrationType') integrationType?: string,
    @Query('status') status?: SyncStatus,
  ) {
    return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, integrationType, status);
  }

  @Get('statistics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get sync statistics' })
  @ApiQuery({ name: 'integrationType', required: false })
  getStatistics(@Query('integrationType') integrationType?: string) {
    return this.service.getStatistics(integrationType);
  }

  @Get('type/:integrationType')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get sync logs by integration type' })
  findByIntegrationType(@Param('integrationType') integrationType: string) {
    return this.service.findByIntegrationType(integrationType);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get sync log by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update sync log' })
  update(@Param('id') id: string, @Body() dto: UpdateSyncLogDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete sync log' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

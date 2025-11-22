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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ChecklistsService } from './checklists.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { CompleteChecklistDto } from './dto/complete-checklist.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantThrottlerGuard } from '../common/guards/tenant-throttler.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('checklists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, TenantThrottlerGuard)
@Throttle({ default: { ttl: 60000, limit: 100 } })
@Controller('checklists')
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  // ============================================
  // CHECKLIST TEMPLATES
  // ============================================

  @Post()
  @ApiOperation({ summary: 'Create a new checklist template' })
  create(@CurrentTenant() tenantId: string, @Body() createDto: CreateChecklistDto) {
    return this.checklistsService.create(tenantId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all checklist templates' })
  findAll(@CurrentTenant() tenantId: string, @Query() filters: any) {
    return this.checklistsService.findAll(tenantId, filters);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all checklist categories' })
  getCategories(@CurrentTenant() tenantId: string) {
    return this.checklistsService.getCategories(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a checklist template by ID' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.checklistsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a checklist template' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateChecklistDto,
  ) {
    return this.checklistsService.update(tenantId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a checklist template' })
  delete(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.checklistsService.delete(tenantId, id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive/deactivate a checklist template' })
  archive(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.checklistsService.archive(tenantId, id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a checklist template' })
  duplicate(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.checklistsService.duplicate(tenantId, id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get checklist completion statistics' })
  getStats(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.checklistsService.getChecklistStats(tenantId, id);
  }

  // ============================================
  // CHECKLIST COMPLETIONS
  // ============================================

  @Post('completions')
  @ApiOperation({ summary: 'Complete a checklist' })
  completeChecklist(
    @CurrentTenant() tenantId: string,
    @Body() completeDto: CompleteChecklistDto,
  ) {
    return this.checklistsService.completeChecklist(tenantId, completeDto);
  }

  @Get('completions')
  @ApiOperation({ summary: 'Get all checklist completions' })
  findAllCompletions(@CurrentTenant() tenantId: string, @Query() filters: any) {
    return this.checklistsService.findAllCompletions(tenantId, filters);
  }

  @Get('completions/:id')
  @ApiOperation({ summary: 'Get a checklist completion by ID' })
  findOneCompletion(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.checklistsService.findOneCompletion(tenantId, id);
  }

  @Delete('completions/:id')
  @ApiOperation({ summary: 'Delete a checklist completion' })
  deleteCompletion(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.checklistsService.deleteCompletion(tenantId, id);
  }
}

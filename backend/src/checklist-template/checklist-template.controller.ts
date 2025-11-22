import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ChecklistTemplateService } from './checklist-template.service';
import { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import { UpdateChecklistTemplateDto } from './dto/update-checklist-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Checklist Templates')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('checklist-template')
export class ChecklistTemplateController {
  constructor(private readonly service: ChecklistTemplateService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create checklist template' })
  create(@Body() dto: CreateChecklistTemplateDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all checklist templates' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'category', required: false })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('category') category?: string) {
    return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, category);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get checklist templates by category' })
  findByCategory(@Param('category') category: string) {
    return this.service.findByCategory(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get checklist template by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update checklist template' })
  update(@Param('id') id: string, @Body() dto: UpdateChecklistTemplateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete checklist template' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

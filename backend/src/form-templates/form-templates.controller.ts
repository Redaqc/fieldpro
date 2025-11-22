import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { FormTemplatesService } from './form-templates.service';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Form Templates')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('form-templates')
export class FormTemplatesController {
  constructor(private readonly formTemplatesService: FormTemplatesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new form template' })
  @ApiResponse({ status: 201, description: 'Form template created' })
  create(@Body() createFormTemplateDto: CreateFormTemplateDto) {
    return this.formTemplatesService.create(createFormTemplateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all form templates' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'category', required: false })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('active') active?: string, @Query('category') category?: string) {
    return this.formTemplatesService.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, active !== undefined ? active === 'true' : undefined, category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get form template by ID with submissions' })
  @ApiResponse({ status: 200, description: 'Form template found' })
  findOne(@Param('id') id: string) {
    return this.formTemplatesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update form template' })
  update(@Param('id') id: string, @Body() updateFormTemplateDto: UpdateFormTemplateDto) {
    return this.formTemplatesService.update(id, updateFormTemplateDto);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Toggle form template active status' })
  toggleActive(@Param('id') id: string) {
    return this.formTemplatesService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete form template (Admin only)' })
  remove(@Param('id') id: string) {
    return this.formTemplatesService.remove(id);
  }
}
